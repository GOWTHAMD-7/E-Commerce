package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Product;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.bgesmallenv15q.BgeSmallEnV15QuantizedEmbeddingModel;
import dev.langchain4j.data.embedding.Embedding;

@Service
public class ProductEmbeddingService {

    private EmbeddingModel embeddingModel;

    @PostConstruct
    public void init() {
        // Initialize the model ONCE when Spring Boot starts
        this.embeddingModel = new BgeSmallEnV15QuantizedEmbeddingModel();
    }

    /**
     * Generates a 384-dimensional semantic embedding for any arbitrary text.
     */
    public float[] generateTextEmbedding(String text) {
        if (!isValid(text)) {
            throw new IllegalArgumentException("Text cannot be null or blank");
        }

        Embedding embedding = embeddingModel.embed(text).content();
        float[] vector = embedding.vector();

        if (vector == null || vector.length != 384) {
            throw new IllegalStateException("Generated embedding does not have 384 dimensions!");
        }

        return vector;
    }

    /**
     * Generates a 384-dimensional semantic embedding for the given product.
     */
    public float[] generateProductEmbedding(Product product) {
        String semanticText = generateSemanticText(product);
        
        return generateTextEmbedding(semanticText);
    }

    /**
     * Converts a Product entity into a rich, semantic text string suitable for BGE-small-en-v1.5.
     * Only includes fields that define the immutable, physical identity of the product.
     * Skips any null or blank fields dynamically.
     */
    public String generateSemanticText(Product product) {
        StringBuilder semanticText = new StringBuilder();

        if (isValid(product.getName())) {
            semanticText.append("Product: ").append(product.getName()).append(".\n");
        }
        if (isValid(product.getCategory())) {
            semanticText.append("Category: ").append(product.getCategory()).append(".\n");
        }
        if (isValid(product.getSubCategory())) {
            semanticText.append("Subcategory: ").append(product.getSubCategory()).append(".\n");
        }
        if (isValid(product.getBrand())) {
            semanticText.append("Brand: ").append(product.getBrand()).append(".\n");
        }
        if (isValid(product.getFit())) {
            semanticText.append("Fit: ").append(product.getFit()).append(".\n");
        }
        if (isValid(product.getMaterial())) {
            semanticText.append("Material: ").append(product.getMaterial()).append(".\n");
        }
        if (isValid(product.getDescription())) {
            // Strip any accidental HTML tags from description just in case, and trim
            String cleanDesc = product.getDescription().replaceAll("<[^>]*>", "").trim();
            semanticText.append("Description: ").append(cleanDesc).append(".\n");
        }

        return semanticText.toString().trim();
    }

    private boolean isValid(String text) {
        return text != null && !text.trim().isEmpty();
    }
}
