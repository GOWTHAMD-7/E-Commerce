package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.dto.GlobalCandidateDTO;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class GlobalRecommendationService {

    private final ProductRepo productRepo;

    // Configurable weights
    private final int candidateLimit;
    private final double weightRating;
    private final double weightPopularity;
    private final double weightFeatured;
    private final double weightNewArrival;
    private final double bayesianConfidencePrior;
    private final double bayesianGlobalMean;

    @Autowired
    public GlobalRecommendationService(
            ProductRepo productRepo,
            @Value("${recommendation.global.candidate-limit:50}") int candidateLimit,
            @Value("${recommendation.global.weight.rating:0.5}") double weightRating,
            @Value("${recommendation.global.weight.popularity:0.3}") double weightPopularity,
            @Value("${recommendation.global.weight.featured:0.1}") double weightFeatured,
            @Value("${recommendation.global.weight.new-arrival:0.1}") double weightNewArrival,
            @Value("${recommendation.global.bayesian.prior:10.0}") double bayesianConfidencePrior,
            @Value("${recommendation.global.bayesian.mean:3.5}") double bayesianGlobalMean) {
        this.productRepo = productRepo;
        this.candidateLimit = candidateLimit;
        this.weightRating = weightRating;
        this.weightPopularity = weightPopularity;
        this.weightFeatured = weightFeatured;
        this.weightNewArrival = weightNewArrival;
        this.bayesianConfidencePrior = bayesianConfidencePrior;
        this.bayesianGlobalMean = bayesianGlobalMean;
    }

    /**
     * Retrieves the top global candidates independent of user interaction history.
     */
    public List<GlobalCandidateDTO> getGlobalCandidates() {
        return getGlobalCandidates(this.candidateLimit);
    }

    /**
     * Retrieves the top global candidates up to a specified limit.
     */
    public List<GlobalCandidateDTO> getGlobalCandidates(int limit) {
        List<Product> activeProducts = productRepo.findByIsActiveTrue();

        return activeProducts.stream()
                .map(product -> new GlobalCandidateDTO(product, calculateGlobalScore(product)))
                .sorted(Comparator.comparingDouble(GlobalCandidateDTO::getGlobalScore).reversed()
                        .thenComparing(dto -> dto.getProduct().getId(), Comparator.reverseOrder()))
                .limit(limit)
                .collect(Collectors.toList());
    }

    /**
     * Calculates the global score using Bayesian Average for ratings and Log10 for view counts.
     */
    public double calculateGlobalScore(Product product) {
        // 1. Bayesian Rating Component
        double rating = product.getRating() != null ? product.getRating() : 0.0;
        int reviewCount = product.getReviewCount() != null ? product.getReviewCount() : 0;
        
        double bayesianRating = ((reviewCount * rating) + (bayesianConfidencePrior * bayesianGlobalMean)) 
                              / (reviewCount + bayesianConfidencePrior);
        
        // Normalize rating scale (0-5) to (0-1) for balanced weighting
        double normalizedRating = bayesianRating / 5.0;

        // 2. Popularity Component (Logarithmic squash to prevent explosive view counts from dominating)
        long viewCount = product.getViewCount() != null ? product.getViewCount() : 0L;
        double popularityScore = Math.log10(viewCount + 1.0);
        
        // Typical view count max expected around 10k -> log10(10000) = 4. 
        // We normalize assuming a rough max of 5.0 (100k views) for smooth combining.
        double normalizedPopularity = Math.min(popularityScore / 5.0, 1.0);

        // 3. Freshness / Featured components
        double featuredBoost = (product.getIsFeatured() != null && product.getIsFeatured()) ? 1.0 : 0.0;
        double newArrivalBoost = (product.getIsNewArrival() != null && product.getIsNewArrival()) ? 1.0 : 0.0;

        // Combine using weights
        return (weightRating * normalizedRating) 
             + (weightPopularity * normalizedPopularity) 
             + (weightFeatured * featuredBoost) 
             + (weightNewArrival * newArrivalBoost);
    }
}
