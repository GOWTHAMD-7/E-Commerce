package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class VectorSearchTest {

    @Autowired
    private ProductRepo productRepo;

    @Test
    public void testVectorSearch() {
        System.out.println("\n===========================================");
        System.out.println("Starting Vector Search Repository Test...");

        // We assume at least some products exist in the DB because backfill ran.
        // Let's create a dummy 384-dimensional embedding (e.g., all 0.1s, or just anything)
        float[] dummyQueryEmbedding = new float[384];
        for (int i = 0; i < 384; i++) {
            dummyQueryEmbedding[i] = 0.1f;
        }

        // Test the repository method
        int limit = 5;
        List<Product> similarProducts = productRepo.findSimilarProducts(dummyQueryEmbedding, limit);

        assertNotNull(similarProducts, "Result list should not be null");
        assertTrue(similarProducts.size() <= limit, "Result list should not exceed limit");

        System.out.println("Found " + similarProducts.size() + " similar products!");

        if (!similarProducts.isEmpty()) {
            System.out.println("Top match: ID=" + similarProducts.get(0).getId() + ", Name=" + similarProducts.get(0).getName());
            
            // Validate that returned products have embeddings and are active
            for (Product p : similarProducts) {
                assertNotNull(p.getEmbedding(), "Returned product must have an embedding");
                assertTrue(p.getIsActive() == null || p.getIsActive(), "Returned product must be active");
                assertEquals(384, p.getEmbedding().length, "Embedding must be 384-dimensional");
            }
        } else {
            System.out.println("No active products with embeddings found in database. (Did the backfill run?)");
        }

        System.out.println("Vector Search Test completed successfully!");
        System.out.println("===========================================\n");
    }
}
