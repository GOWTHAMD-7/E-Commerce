package e_commerce.com.example.e.commerce;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.bgesmallenv15q.BgeSmallEnV15QuantizedEmbeddingModel;
import dev.langchain4j.data.embedding.Embedding;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
public class EmbeddingVerificationTest {

    @Test
    public void verifyBgeSmallEmbedding() {
        System.out.println("\n===========================================");
        System.out.println("1. Initializing BGE-small-en-v1.5 Model...");
        
        // 1. Initialize the model
        EmbeddingModel embeddingModel = new BgeSmallEnV15QuantizedEmbeddingModel();
        
        System.out.println("Model initialized successfully!");
        System.out.println("2. Generating embedding for: 'Men's black oversized cotton t-shirt'");
        
        // 2. Generate the embedding
        Embedding embedding = embeddingModel.embed("Men's black oversized cotton t-shirt").content();
        
        // 3. Print the dimension
        int dimension = embedding.dimension();
        System.out.println("3. Embedding Dimension: " + dimension);
        
        // 4. Print success status
        boolean isSuccess = (embedding != null && dimension == 384);
        System.out.println("4. Success? " + isSuccess);
        System.out.println("===========================================\n");
        
        // Assertions for the test runner
        assertNotNull(embedding, "Embedding should not be null");
        assertEquals(384, dimension, "Dimension should be 384");
    }
}
