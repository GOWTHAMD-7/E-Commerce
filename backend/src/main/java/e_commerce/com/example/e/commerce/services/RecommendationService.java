package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.dto.CandidateDTO;
import e_commerce.com.example.e.commerce.dto.FinalRecommendationDTO;
import e_commerce.com.example.e.commerce.dto.GlobalCandidateDTO;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class RecommendationService {

    private static final Logger log = LoggerFactory.getLogger(RecommendationService.class);

    private final UserInteractionService userInteractionService;
    private final PersonalizedRecommendationService personalizedRecommendationService;
    private final GlobalRecommendationService globalRecommendationService;

    private final int finalResultLimit;
    private final double poolMultiplier;

    @Autowired
    public RecommendationService(
            UserInteractionService userInteractionService,
            PersonalizedRecommendationService personalizedRecommendationService,
            GlobalRecommendationService globalRecommendationService,
            @Value("${recommendation.final-result-limit:20}") int finalResultLimit,
            @Value("${recommendation.pool-multiplier:2.0}") double poolMultiplier) {
        this.userInteractionService = userInteractionService;
        this.personalizedRecommendationService = personalizedRecommendationService;
        this.globalRecommendationService = globalRecommendationService;
        this.finalResultLimit = finalResultLimit;
        this.poolMultiplier = poolMultiplier;
    }

    @Transactional(readOnly = true)
    public List<FinalRecommendationDTO> getRecommendations(User user) {
        long startTime = System.currentTimeMillis();

        if (user == null) {
            log.info("Generating recommendations for unauthenticated user (100% global)");
            List<FinalRecommendationDTO> recs = getPureGlobalRecommendations();
            log.info("Generated {} global recommendations in {} ms", recs.size(), System.currentTimeMillis() - startTime);
            return recs;
        }

        long interactionCount = userInteractionService.getInteractionCount(user);

        log.info("User {} has {} interactions", user.getId(), interactionCount);

        // Cold-start condition: 0-4 interactions -> 100% global
        if (interactionCount <= 4) {
            log.info("Cold start for user {} (interactions: {}). Generating 100% global recommendations", user.getId(), interactionCount);
            List<FinalRecommendationDTO> recs = getPureGlobalRecommendations();
            log.info("Generated {} global recommendations in {} ms", recs.size(), System.currentTimeMillis() - startTime);
            return recs;
        }

        double pWeight;
        double gWeight;

        if (interactionCount >= 50) {
            gWeight = 0.20;
            pWeight = 0.80;
        } else if (interactionCount >= 20) {
            gWeight = 0.40;
            pWeight = 0.60;
        } else { // 5 - 19
            gWeight = 0.70;
            pWeight = 0.30;
        }

        int fetchPoolSize = (int) (finalResultLimit * poolMultiplier);

        long pStart = System.currentTimeMillis();
        List<CandidateDTO> personalizedCandidates = personalizedRecommendationService.getPersonalizedCandidates(user);
        long pDuration = System.currentTimeMillis() - pStart;
        log.debug("Fetched {} personalized candidates in {} ms", personalizedCandidates.size(), pDuration);

        // Truncate personalized candidates to pool size if needed
        if (personalizedCandidates.size() > fetchPoolSize) {
            personalizedCandidates = personalizedCandidates.subList(0, fetchPoolSize);
        }

        // If for some reason we have no personalized candidates (e.g., preference vector failed), fallback to global
        if (personalizedCandidates.isEmpty()) {
            log.warn("No personalized candidates found for user {} despite having interactions. Falling back to global.", user.getId());
            List<FinalRecommendationDTO> recs = getPureGlobalRecommendations();
            log.info("Generated {} global recommendations in {} ms", recs.size(), System.currentTimeMillis() - startTime);
            return recs;
        }

        long gStart = System.currentTimeMillis();
        List<GlobalCandidateDTO> globalCandidates = globalRecommendationService.getGlobalCandidates(fetchPoolSize);
        long gDuration = System.currentTimeMillis() - gStart;
        log.debug("Fetched {} global candidates in {} ms", globalCandidates.size(), gDuration);

        long blendStart = System.currentTimeMillis();
        List<FinalRecommendationDTO> finalResults = blendAndRank(personalizedCandidates, globalCandidates, pWeight, gWeight, finalResultLimit);
        long blendDuration = System.currentTimeMillis() - blendStart;
        
        long totalDuration = System.currentTimeMillis() - startTime;
        log.info("Recommendation pipeline for user {} complete in {} ms (pVector/Search: {}ms, global: {}ms, blend: {}ms). Returned {} results. Weights: P={} / G={}", 
                user.getId(), totalDuration, pDuration, gDuration, blendDuration, finalResults.size(), pWeight, gWeight);

        return finalResults;
    }

    private List<FinalRecommendationDTO> getPureGlobalRecommendations() {
        return globalRecommendationService.getGlobalCandidates(finalResultLimit).stream()
                .map(g -> new FinalRecommendationDTO(g.getProduct(), g.getGlobalScore()))
                .collect(Collectors.toList());
    }

    private List<FinalRecommendationDTO> blendAndRank(
            List<CandidateDTO> pCandidates,
            List<GlobalCandidateDTO> gCandidates,
            double pWeight,
            double gWeight,
            int limit) {

        // 1. Min-Max Normalization
        double pMin = pCandidates.stream().mapToDouble(CandidateDTO::getSimilarityScore).min().orElse(0.0);
        double pMax = pCandidates.stream().mapToDouble(CandidateDTO::getSimilarityScore).max().orElse(1.0);
        if (pMax == pMin) pMax = pMin + 1.0; // avoid division by zero

        double gMin = gCandidates.stream().mapToDouble(GlobalCandidateDTO::getGlobalScore).min().orElse(0.0);
        double gMax = gCandidates.stream().mapToDouble(GlobalCandidateDTO::getGlobalScore).max().orElse(1.0);
        if (gMax == gMin) gMax = gMin + 1.0;

        Map<Long, Double> normalizedP = new HashMap<>();
        for (CandidateDTO c : pCandidates) {
            double norm = (c.getSimilarityScore() - pMin) / (pMax - pMin);
            normalizedP.put(c.getProduct().getId(), norm);
        }

        Map<Long, Double> normalizedG = new HashMap<>();
        for (GlobalCandidateDTO c : gCandidates) {
            double norm = (c.getGlobalScore() - gMin) / (gMax - gMin);
            normalizedG.put(c.getProduct().getId(), norm);
        }

        // 2. Merge Products
        Map<Long, Product> productMap = new HashMap<>();
        for (CandidateDTO c : pCandidates) productMap.put(c.getProduct().getId(), c.getProduct());
        for (GlobalCandidateDTO c : gCandidates) productMap.put(c.getProduct().getId(), c.getProduct());

        // 3. Compute Final Score
        List<FinalRecommendationDTO> results = new ArrayList<>();
        for (Product product : productMap.values()) {
            double normP = normalizedP.getOrDefault(product.getId(), 0.0);
            double normG = normalizedG.getOrDefault(product.getId(), 0.0);

            double finalScore = (pWeight * normP) + (gWeight * normG);
            results.add(new FinalRecommendationDTO(product, finalScore));
        }

        // 4. Sort and limit (Deterministic tie-breaking using Product ID DESC)
        results.sort((a, b) -> {
            int scoreCompare = Double.compare(b.getFinalScore(), a.getFinalScore());
            if (scoreCompare != 0) {
                return scoreCompare;
            }
            return Long.compare(b.getProduct().getId(), a.getProduct().getId());
        });

        if (results.size() > limit) {
            results = results.subList(0, limit);
        }

        return results;
    }
}
