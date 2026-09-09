package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class SemanticSearchService {

    private final ProductEmbeddingService embeddingService;
    private final ProductRepo productRepo;

    @Autowired
    public SemanticSearchService(ProductEmbeddingService embeddingService, ProductRepo productRepo) {
        this.embeddingService = embeddingService;
        this.productRepo = productRepo;
    }

    /**
     * Performs a semantic search for products based on the given text query.
     * 
     * @param query The natural language search query.
     * @param limit The maximum number of results to return.
     * @return List of semantically similar active products.
     */
    public List<Product> search(String query, Integer limit) {
        // 1. Validate the query
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }
        
        String cleanQuery = query.trim();

        // 2. Validate and clamp the limit
        int finalLimit = (limit != null && limit > 0) ? limit : 10;
        if (finalLimit > 50) {
            // Prevent unreasonable limits that could overload the DB or network
            finalLimit = 50;
        }

        // 3. Generate the query embedding
        float[] queryEmbedding = embeddingService.generateTextEmbedding(cleanQuery);

        // 4. Perform vector search in PostgreSQL using the repository
        return productRepo.findSimilarProducts(queryEmbedding, finalLimit);
    }
}
