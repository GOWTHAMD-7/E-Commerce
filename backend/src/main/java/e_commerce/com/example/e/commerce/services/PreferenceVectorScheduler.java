package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.InteractionType;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.models.UserInteraction;
import e_commerce.com.example.e.commerce.repos.UserInteractionRepo;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * PreferenceVectorScheduler — runs every 5 minutes.
 *
 * Collects all UserInteractions where preference_synced = false,
 * groups them by user, and incrementally merges them into the stored
 * preference_vector on the app_user table.
 *
 * This avoids recalculating the full preference vector on every recommendation
 * request, and batches HF API calls for search-type interactions.
 */
@Service
public class PreferenceVectorScheduler {

    private static final Logger log = LoggerFactory.getLogger(PreferenceVectorScheduler.class);
    private static final int VECTOR_DIMENSION = 384;

    private final UserInteractionRepo userInteractionRepo;
    private final UserRepository userRepository;
    private final ProductEmbeddingService productEmbeddingService;

    @Value("${recommendation.decay-lambda:0.1}")
    private double decayLambda;

    /** Weight given to the existing stored vector vs new interactions (0.0-1.0) */
    @Value("${recommendation.preference-blend-factor:0.7}")
    private double blendFactor;

    public PreferenceVectorScheduler(
            UserInteractionRepo userInteractionRepo,
            UserRepository userRepository,
            ProductEmbeddingService productEmbeddingService) {
        this.userInteractionRepo = userInteractionRepo;
        this.userRepository = userRepository;
        this.productEmbeddingService = productEmbeddingService;
    }

    /**
     * Runs every 5 minutes. Processes all unsynced interactions and updates
     * the stored preference vector for each affected user.
     */
    @Scheduled(fixedDelayString = "${recommendation.preference-sync-interval-ms:300000}")
    @Transactional
    public void syncPreferenceVectors() {
        List<UserInteraction> unsynced = userInteractionRepo.findAllUnsyncedWithDetails();

        if (unsynced.isEmpty()) {
            return;
        }

        log.info("[PreferenceSync] Processing {} unsynced interactions", unsynced.size());
        long startTime = System.currentTimeMillis();

        // Group interactions by user
        Map<Long, List<UserInteraction>> byUser = unsynced.stream()
                .collect(Collectors.groupingBy(i -> i.getUser().getId()));

        List<Long> processedIds = new ArrayList<>();

        for (Map.Entry<Long, List<UserInteraction>> entry : byUser.entrySet()) {
            Long userId = entry.getKey();
            List<UserInteraction> interactions = entry.getValue();
            User user = interactions.get(0).getUser();

            try {
                float[] newBatchVector = buildVectorFromInteractions(interactions);
                if (newBatchVector == null) {
                    // All interactions for this user were unusable (e.g. SEARCH with empty query)
                    // Still mark as synced so we don't retry forever
                    interactions.forEach(i -> processedIds.add(i.getId()));
                    continue;
                }

                // Blend with existing stored vector if it exists
                float[] existing = user.getPreferenceVector();
                float[] updated;
                if (existing != null && existing.length == VECTOR_DIMENSION) {
                    updated = blendVectors(existing, newBatchVector);
                } else {
                    updated = normalizeVector(newBatchVector);
                }

                // Persist using native query (avoids loading full User entity into JPA cache)
                userRepository.updatePreferenceVector(userId, vectorToString(updated));

                interactions.forEach(i -> processedIds.add(i.getId()));
                log.debug("[PreferenceSync] Updated preference vector for user {}", userId);

            } catch (Exception e) {
                log.error("[PreferenceSync] Failed to update preference vector for user {}: {}", userId, e.getMessage());
                // Don't mark as synced — will retry next cycle
            }
        }

        // Batch-mark all successfully processed interactions as synced
        if (!processedIds.isEmpty()) {
            userInteractionRepo.markAsSynced(processedIds);
        }

        log.info("[PreferenceSync] Done. Processed {} users in {} ms",
                byUser.size(), System.currentTimeMillis() - startTime);
    }

    /**
     * Builds a weighted average vector from a list of interactions.
     * For product interactions: uses the product's stored embedding directly.
     * For search interactions: calls HF API to embed the search query.
     * Returns null if no usable interactions are found.
     */
    private float[] buildVectorFromInteractions(List<UserInteraction> interactions) {
        float[] accumulator = new float[VECTOR_DIMENSION];
        double totalWeight = 0.0;
        LocalDateTime now = LocalDateTime.now();
        int usable = 0;

        for (UserInteraction interaction : interactions) {
            float[] vector = resolveVector(interaction);
            if (vector == null) continue;

            long minutesAge = ChronoUnit.MINUTES.between(interaction.getCreatedAt(), now);
            double ageInDays = Math.max(0, minutesAge / 1440.0);
            double recency = Math.exp(-decayLambda * ageInDays);
            double weight = interaction.getWeight() * recency;

            for (int i = 0; i < VECTOR_DIMENSION; i++) {
                accumulator[i] += vector[i] * weight;
            }
            totalWeight += weight;
            usable++;
        }

        if (usable == 0 || totalWeight == 0) return null;

        // Divide by total weight to get weighted average
        for (int i = 0; i < VECTOR_DIMENSION; i++) {
            accumulator[i] /= totalWeight;
        }

        return accumulator;
    }

    private float[] resolveVector(UserInteraction interaction) {
        if (interaction.getInteractionType() == InteractionType.SEARCH) {
            String query = interaction.getSearchQuery();
            if (query == null || query.trim().isEmpty()) return null;
            try {
                return productEmbeddingService.generateTextEmbedding(query.trim());
            } catch (Exception e) {
                log.warn("[PreferenceSync] Failed to embed search query '{}': {}", query, e.getMessage());
                return null;
            }
        } else {
            if (interaction.getProduct() == null) return null;
            float[] embedding = interaction.getProduct().getEmbedding();
            return (embedding != null && embedding.length == VECTOR_DIMENSION) ? embedding : null;
        }
    }

    /**
     * Blends existing stored vector with the new batch vector.
     * blendFactor controls how much the old vector is retained:
     *   0.7 = 70% old + 30% new interactions
     */
    private float[] blendVectors(float[] existing, float[] newBatch) {
        float[] blended = new float[VECTOR_DIMENSION];
        for (int i = 0; i < VECTOR_DIMENSION; i++) {
            blended[i] = (float) (existing[i] * blendFactor + newBatch[i] * (1.0 - blendFactor));
        }
        return normalizeVector(blended);
    }

    private float[] normalizeVector(float[] vector) {
        double magnitudeSq = 0.0;
        for (float v : vector) magnitudeSq += v * v;
        if (magnitudeSq == 0) return vector;
        double magnitude = Math.sqrt(magnitudeSq);
        float[] normalized = new float[vector.length];
        for (int i = 0; i < vector.length; i++) {
            normalized[i] = (float) (vector[i] / magnitude);
        }
        return normalized;
    }

    /** Converts a float[] to the pgvector string format: "[0.1,0.2,...]" */
    private String vectorToString(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            sb.append(vector[i]);
            if (i < vector.length - 1) sb.append(",");
        }
        sb.append("]");
        return sb.toString();
    }
}
