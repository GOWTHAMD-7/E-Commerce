package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Product;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * ProductEmbeddingService - generates 384-dim embeddings via Hugging Face Inference API.
 *
 * This replaces the local ONNX model (BgeSmallEnV15QuantizedEmbeddingModel) which consumed
 * ~120MB of heap on startup, causing OOM on Render's free tier (512MB).
 *
 * Model used: BAAI/bge-small-en-v1.5 (same model, same 384-dim output, remote call instead).
 * Free tier: 1000 requests/day with no key, more with a free HF token.
 *
 * Fallback: If HF API is unavailable, embedding generation throws an exception and the
 * product is saved without an embedding (recommendations fall back to top-rated).
 */
@Service
public class ProductEmbeddingService {

    private static final String HF_API_URL =
            "https://api-inference.huggingface.co/pipeline/feature-extraction/BAAI/bge-small-en-v1.5";

    @Value("${huggingface.api.token:}")
    private String hfApiToken;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Generates a 384-dimensional semantic embedding for any arbitrary text
     * by calling the Hugging Face Inference API.
     */
    public float[] generateTextEmbedding(String text) {
        if (!isValid(text)) {
            throw new IllegalArgumentException("Text cannot be null or blank");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Add HF token if configured (optional but increases rate limit)
            if (hfApiToken != null && !hfApiToken.isBlank()) {
                headers.set("Authorization", "Bearer " + hfApiToken);
            }

            // HF feature-extraction pipeline expects {"inputs": "text"}
            Map<String, Object> requestBody = Map.of(
                    "inputs", text,
                    "options", Map.of("wait_for_model", true)
            );

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Object> response = restTemplate.exchange(
                    HF_API_URL,
                    HttpMethod.POST,
                    entity,
                    Object.class
            );

            float[] vector = parseEmbeddingResponse(response.getBody());

            if (vector == null || vector.length != 384) {
                throw new IllegalStateException(
                        "HF API returned unexpected embedding dimension: " +
                        (vector == null ? "null" : vector.length));
            }

            return vector;

        } catch (Exception e) {
            throw new RuntimeException("Failed to generate embedding via Hugging Face API: " + e.getMessage(), e);
        }
    }

    /**
     * Generates a 384-dimensional semantic embedding for the given product.
     */
    public float[] generateProductEmbedding(Product product) {
        String semanticText = generateSemanticText(product);
        return generateTextEmbedding(semanticText);
    }

    /**
     * Parses the HF feature-extraction response.
     * The response is either: [[float, float, ...]] (batched) or [float, float, ...] (single).
     */
    @SuppressWarnings("unchecked")
    private float[] parseEmbeddingResponse(Object body) {
        if (body == null) return null;

        List<?> outer = (List<?>) body;
        if (outer.isEmpty()) return null;

        // If batched: [[...]] -> unwrap first element
        Object first = outer.get(0);
        List<?> floatList;
        if (first instanceof List) {
            floatList = (List<?>) first;
        } else {
            floatList = outer;
        }

        float[] vector = new float[floatList.size()];
        for (int i = 0; i < floatList.size(); i++) {
            Object val = floatList.get(i);
            if (val instanceof Double) {
                vector[i] = ((Double) val).floatValue();
            } else if (val instanceof Float) {
                vector[i] = (Float) val;
            } else if (val instanceof Integer) {
                vector[i] = ((Integer) val).floatValue();
            }
        }
        return vector;
    }

    /**
     * Converts a Product entity into a rich semantic text string for embedding.
     * Only includes fields that define the product's identity.
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
            String cleanDesc = product.getDescription().replaceAll("<[^>]*>", "").trim();
            semanticText.append("Description: ").append(cleanDesc).append(".\n");
        }

        return semanticText.toString().trim();
    }

    private boolean isValid(String text) {
        return text != null && !text.trim().isEmpty();
    }
}
