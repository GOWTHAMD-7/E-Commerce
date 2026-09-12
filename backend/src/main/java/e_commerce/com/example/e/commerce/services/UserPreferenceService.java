package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.InteractionType;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.models.UserInteraction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

@Service
public class UserPreferenceService {

    private final UserInteractionService userInteractionService;
    private final ProductEmbeddingService productEmbeddingService;
    private final double decayLambda;

    private static final int VECTOR_DIMENSION = 384;

    @Autowired
    public UserPreferenceService(
            UserInteractionService userInteractionService,
            ProductEmbeddingService productEmbeddingService,
            @Value("${recommendation.decay-lambda:0.1}") double decayLambda) {
        this.userInteractionService = userInteractionService;
        this.productEmbeddingService = productEmbeddingService;
        this.decayLambda = decayLambda;
    }

    /**
     * Builds a normalized semantic preference vector based on the user's interaction history.
     * Returns Optional.empty() if the user has no usable interactions.
     */
    public Optional<float[]> buildUserPreferenceVector(User user) {
        if (user == null) {
            return Optional.empty();
        }

        List<UserInteraction> interactions = userInteractionService.getUserInteractions(user);
        if (interactions == null || interactions.isEmpty()) {
            return Optional.empty();
        }

        float[] accumulator = new float[VECTOR_DIMENSION];
        double totalEffectiveWeight = 0.0;
        LocalDateTime now = LocalDateTime.now();
        int usableInteractions = 0;

        for (UserInteraction interaction : interactions) {
            float[] vector = null;

            if (interaction.getInteractionType() == InteractionType.SEARCH) {
                if (interaction.getSearchQuery() != null && !interaction.getSearchQuery().trim().isEmpty()) {
                    try {
                        vector = productEmbeddingService.generateTextEmbedding(interaction.getSearchQuery().trim());
                    } catch (Exception e) {
                        System.err.println("Failed to generate embedding for SEARCH interaction: " + e.getMessage());
                        continue;
                    }
                }
            } else {
                if (interaction.getProduct() != null) {
                    vector = interaction.getProduct().getEmbedding();
                }
            }

            if (vector == null || vector.length != VECTOR_DIMENSION) {
                // Ignore interactions without a valid 384D embedding
                continue;
            }

            // Calculate age in fractional days
            long minutesAge = ChronoUnit.MINUTES.between(interaction.getCreatedAt(), now);
            double ageInDays = Math.max(0, minutesAge / 1440.0);

            // Calculate recency factor using exponential decay
            double recencyFactor = Math.exp(-decayLambda * ageInDays);
            
            // Calculate effective weight
            int baseWeight = interaction.getInteractionType().getWeight();
            double effectiveWeight = baseWeight * recencyFactor;

            // Accumulate weighted vector
            for (int i = 0; i < VECTOR_DIMENSION; i++) {
                accumulator[i] += vector[i] * effectiveWeight;
            }
            totalEffectiveWeight += effectiveWeight;
            usableInteractions++;
        }

        if (usableInteractions == 0 || totalEffectiveWeight == 0) {
            return Optional.empty();
        }

        // Compute the weighted average vector (optional before normalization, but normalization overrides the scale anyway)
        // Normalizing the vector is required to use cosine similarity correctly.
        return Optional.of(normalizeVector(accumulator));
    }

    /**
     * Normalizes the vector to unit length.
     */
    private float[] normalizeVector(float[] vector) {
        float[] normalized = new float[vector.length];
        double magnitudeSq = 0.0;
        
        for (float v : vector) {
            magnitudeSq += v * v;
        }
        
        if (magnitudeSq == 0) {
            return vector; // Cannot normalize zero vector
        }
        
        double magnitude = Math.sqrt(magnitudeSq);
        for (int i = 0; i < vector.length; i++) {
            normalized[i] = (float) (vector[i] / magnitude);
        }
        
        return normalized;
    }
}
