package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class HybridSearchService {

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private ProductEmbeddingService embeddingService;

    // Configurable parameters
    private static final int CANDIDATE_MULTIPLIER = 3;
    private static final double RRF_K = 60.0;
    private static final int MAX_FETCH_LIMIT = 500; // Hard limit to protect DB

    public List<Product> search(String query, int page, int limit) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        // 1. Calculate fetch sizes
        int offset = page * limit;
        int candidateSize = limit * CANDIDATE_MULTIPLIER;
        int fetchLimit = offset + candidateSize;
        
        // Protect DB memory from huge queries
        if (fetchLimit > MAX_FETCH_LIMIT) {
            fetchLimit = MAX_FETCH_LIMIT;
        }
        
        // 2. Keyword Retrieval (FTS)
        String formattedQuery = Arrays.stream(query.trim().split("\\s+"))
                .filter(word -> !word.isEmpty())
                .map(word -> word.replaceAll("[^a-zA-Z0-9]", "") + ":*")
                .filter(word -> !word.equals(":*"))
                .collect(Collectors.joining(" & "));

        List<Product> keywordCandidates = Collections.emptyList();
        if (!formattedQuery.isEmpty()) {
            keywordCandidates = productRepo.searchProductsFTSWithLimit(formattedQuery, query.trim(), fetchLimit);
        }

        // 3. Semantic Retrieval (pgvector)
        float[] queryEmbedding = embeddingService.generateTextEmbedding(query);
        List<Product> semanticCandidates = productRepo.findSimilarProducts(queryEmbedding, fetchLimit);

        // 4. Merge Candidates & Calculate RRF
        // Map to store combined RRF score for each unique product ID
        Map<Long, Double> rrfScores = new HashMap<>();
        Map<Long, Product> productMap = new HashMap<>();

        // Add Keyword RRF
        for (int i = 0; i < keywordCandidates.size(); i++) {
            Product p = keywordCandidates.get(i);
            double rank = i + 1;
            double score = 1.0 / (RRF_K + rank);
            rrfScores.put(p.getId(), rrfScores.getOrDefault(p.getId(), 0.0) + score);
            productMap.putIfAbsent(p.getId(), p);
        }

        // Add Semantic RRF
        for (int i = 0; i < semanticCandidates.size(); i++) {
            Product p = semanticCandidates.get(i);
            double rank = i + 1;
            double score = 1.0 / (RRF_K + rank);
            rrfScores.put(p.getId(), rrfScores.getOrDefault(p.getId(), 0.0) + score);
            productMap.putIfAbsent(p.getId(), p);
        }

        // 5. Final Hybrid Ranking
        List<Product> mergedCandidates = new ArrayList<>(productMap.values());
        
        mergedCandidates.sort((p1, p2) -> {
            Double score1 = rrfScores.get(p1.getId());
            Double score2 = rrfScores.get(p2.getId());
            
            // Sort by RRF descending
            int scoreCompare = Double.compare(score2, score1);
            if (scoreCompare != 0) {
                return scoreCompare;
            }
            
            // Tie-breaker: deterministic order (e.g., view count or product ID)
            long v1 = p1.getViewCount() != null ? p1.getViewCount() : 0L;
            long v2 = p2.getViewCount() != null ? p2.getViewCount() : 0L;
            if (v1 != v2) {
                return Long.compare(v2, v1); // View count descending
            }
            return Long.compare(p2.getId(), p1.getId()); // ID descending
        });

        // 6. Pagination
        if (offset >= mergedCandidates.size()) {
            return Collections.emptyList();
        }

        int toIndex = Math.min(offset + limit, mergedCandidates.size());
        return mergedCandidates.subList(offset, toIndex);
    }
}
