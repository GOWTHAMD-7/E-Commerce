package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.services.ProductEmbeddingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class ProductEmbeddingServiceTest {

    @Autowired
    private ProductEmbeddingService productEmbeddingService;

    @Test
    public void verifyProductEmbeddingGeneration() {
        System.out.println("\n===========================================");
        System.out.println("Starting ProductEmbeddingService Test...");

        // 1. Create a sample Product
        Product p1 = new Product();
        p1.setName("Men's Black Oversized T-Shirt");
        p1.setCategory("T-Shirts");
        p1.setSubCategory("Oversized");
        p1.setBrand("XYZ");
        p1.setFit("Oversized");
        p1.setMaterial("Cotton");
        p1.setDescription("Relaxed black cotton t-shirt for everyday wear.");
        
        // 2. Generate its embedding
        System.out.println("Generating embedding for Product 1...");
        float[] embedding1 = productEmbeddingService.generateProductEmbedding(p1);
        
        // 3. Print/verify the dimension is 384
        System.out.println("Product 1 Embedding Dimension: " + embedding1.length);
        assertNotNull(embedding1);
        assertEquals(384, embedding1.length);

        // 4. Confirm the service can generate embeddings for multiple products
        //    without reinitializing (it should be very fast)
        System.out.println("Generating embedding for Product 2 (should be instant)...");
        
        Product p2 = new Product();
        p2.setName("Women's Running Shoes");
        p2.setCategory("Footwear");
        p2.setBrand("Nike");
        p2.setDescription("Lightweight running shoes.");
        
        float[] embedding2 = productEmbeddingService.generateProductEmbedding(p2);
        
        System.out.println("Product 2 Embedding Dimension: " + embedding2.length);
        assertNotNull(embedding2);
        assertEquals(384, embedding2.length);
        
        System.out.println("Test completed successfully!");
        System.out.println("===========================================\n");
    }
}
