package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.services.SemanticSearchService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class SemanticSearchServiceTest {

    @Autowired
    private SemanticSearchService semanticSearchService;

    @Test
    public void testSemanticSearch() {
        System.out.println("\n===========================================");
        System.out.println("Starting Semantic Search Service Test...");

        // 1. Valid Query Test
        String query = "black oversized t-shirt";
        int limit = 5;
        
        List<Product> results = semanticSearchService.search(query, limit);
        
        assertNotNull(results, "Search results should not be null");
        assertTrue(results.size() <= limit, "Search results must not exceed limit");
        
        System.out.println("Query: '" + query + "'");
        System.out.println("Found " + results.size() + " semantic matches!");
        
        if (!results.isEmpty()) {
            System.out.println("Top Match: " + results.get(0).getName());
        }

        // 2. Empty Query Validation Test
        List<Product> emptyResults = semanticSearchService.search("   ", 10);
        assertTrue(emptyResults.isEmpty(), "Empty/blank queries should return empty list without throwing errors");

        // 3. Limit Clamping Test
        List<Product> clampedResults = semanticSearchService.search("shoes", 1000);
        assertTrue(clampedResults.size() <= 50, "Limit over 50 should be clamped to 50 max");

        System.out.println("Semantic Search Service Test completed successfully!");
        System.out.println("===========================================\n");
    }
}
