package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.models.InteractionType;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.models.UserInteraction;
import e_commerce.com.example.e.commerce.services.ProductEmbeddingService;
import e_commerce.com.example.e.commerce.services.UserInteractionService;
import e_commerce.com.example.e.commerce.services.UserPreferenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UserPreferenceServiceTest {

    @Mock
    private UserInteractionService userInteractionService;

    @Mock
    private ProductEmbeddingService productEmbeddingService;

    private UserPreferenceService userPreferenceService;

    private User testUser;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        // Inject with lambda = 0.1
        userPreferenceService = new UserPreferenceService(userInteractionService, productEmbeddingService, 0.1);
        testUser = new User();
        testUser.setId(1L);
    }

    private float[] createDummyVector(float fillValue) {
        float[] vector = new float[384];
        for (int i = 0; i < 384; i++) {
            vector[i] = fillValue;
        }
        return vector;
    }

    private float[] normalize(float[] vector) {
        float[] normalized = new float[vector.length];
        double magnitudeSq = 0.0;
        for (float v : vector) magnitudeSq += v * v;
        double magnitude = Math.sqrt(magnitudeSq);
        for (int i = 0; i < vector.length; i++) {
            normalized[i] = (float) (vector[i] / magnitude);
        }
        return normalized;
    }

    // 1. user with zero interactions
    @Test
    public void testZeroInteractions() {
        when(userInteractionService.getUserInteractions(testUser)).thenReturn(Collections.emptyList());

        Optional<float[]> result = userPreferenceService.buildUserPreferenceVector(testUser);
        assertFalse(result.isPresent());
    }

    // 2. user with one VIEW
    // 8. resulting preference vector having 384 dimensions
    // 9. resulting vector being normalized
    @Test
    public void testOneViewInteraction() {
        Product p = new Product();
        float[] pVector = createDummyVector(0.5f);
        p.setEmbedding(pVector);

        UserInteraction ui = new UserInteraction();
        ui.setInteractionType(InteractionType.VIEW);
        ui.setProduct(p);
        ui.setCreatedAt(LocalDateTime.now());

        when(userInteractionService.getUserInteractions(testUser)).thenReturn(List.of(ui));

        Optional<float[]> result = userPreferenceService.buildUserPreferenceVector(testUser);
        assertTrue(result.isPresent());
        
        float[] prefVector = result.get();
        assertEquals(384, prefVector.length, "Result must have 384 dimensions");

        // Check if normalized
        double magSq = 0;
        for (float v : prefVector) magSq += v * v;
        assertEquals(1.0, Math.sqrt(magSq), 0.001, "Vector must be normalized");

        // 10. no product embedding is regenerated unnecessarily
        verify(productEmbeddingService, never()).generateProductEmbedding(any());
        verify(productEmbeddingService, never()).generateTextEmbedding(any());
    }

    // 3. user with multiple interaction types
    // 4. stronger interactions having greater influence
    @Test
    public void testStrongerInteractionsHaveGreaterInfluence() {
        Product p1 = new Product();
        p1.setEmbedding(createDummyVector(1.0f)); // VIEW product

        Product p2 = new Product();
        p2.setEmbedding(createDummyVector(-1.0f)); // PURCHASE product

        LocalDateTime now = LocalDateTime.now();

        UserInteraction view = new UserInteraction();
        view.setInteractionType(InteractionType.VIEW); // weight 1
        view.setProduct(p1);
        view.setCreatedAt(now); // same age

        UserInteraction purchase = new UserInteraction();
        purchase.setInteractionType(InteractionType.PURCHASE); // weight 5
        purchase.setProduct(p2);
        purchase.setCreatedAt(now); // same age

        when(userInteractionService.getUserInteractions(testUser)).thenReturn(List.of(view, purchase));

        Optional<float[]> result = userPreferenceService.buildUserPreferenceVector(testUser);
        assertTrue(result.isPresent());
        
        // Since PURCHASE has 5x weight of VIEW and same age, the final vector should be heavily pulled towards p2 (-1.0)
        // Expected unnormalized sum: (1.0 * 1) + (-1.0 * 5) = -4.0 per dimension
        // Normalized vector will have negative values.
        assertTrue(result.get()[0] < 0, "Stronger PURCHASE interaction should outweigh VIEW");
    }

    // 5. recent interactions having greater influence than old interactions
    @Test
    public void testRecentInteractionsHaveGreaterInfluence() {
        Product oldProduct = new Product();
        oldProduct.setEmbedding(createDummyVector(1.0f));

        Product newProduct = new Product();
        newProduct.setEmbedding(createDummyVector(-1.0f));

        UserInteraction oldPurchase = new UserInteraction();
        oldPurchase.setInteractionType(InteractionType.PURCHASE);
        oldPurchase.setProduct(oldProduct);
        oldPurchase.setCreatedAt(LocalDateTime.now().minusDays(30)); // 30 days old

        UserInteraction newPurchase = new UserInteraction();
        newPurchase.setInteractionType(InteractionType.PURCHASE);
        newPurchase.setProduct(newProduct);
        newPurchase.setCreatedAt(LocalDateTime.now()); // brand new

        when(userInteractionService.getUserInteractions(testUser)).thenReturn(List.of(oldPurchase, newPurchase));

        Optional<float[]> result = userPreferenceService.buildUserPreferenceVector(testUser);
        assertTrue(result.isPresent());

        // Because of exponential decay, newPurchase should dominate oldPurchase even though they are both PURCHASEs.
        assertTrue(result.get()[0] < 0, "Recent interaction should outweigh older interaction");
    }

    // 6. SEARCH interaction contributing through its query embedding
    @Test
    public void testSearchInteractionUsesQueryEmbedding() {
        UserInteraction search = new UserInteraction();
        search.setInteractionType(InteractionType.SEARCH);
        search.setSearchQuery("gaming laptop");
        search.setCreatedAt(LocalDateTime.now());

        float[] searchVector = createDummyVector(0.7f);
        when(productEmbeddingService.generateTextEmbedding("gaming laptop")).thenReturn(searchVector);
        when(userInteractionService.getUserInteractions(testUser)).thenReturn(List.of(search));

        Optional<float[]> result = userPreferenceService.buildUserPreferenceVector(testUser);
        assertTrue(result.isPresent());
        
        verify(productEmbeddingService, times(1)).generateTextEmbedding("gaming laptop");
        
        // Assert it was used successfully
        double magSq = 0;
        for (float v : result.get()) magSq += v * v;
        assertEquals(1.0, Math.sqrt(magSq), 0.001);
    }

    // 7. interactions with missing product embeddings being ignored
    @Test
    public void testMissingEmbeddingsIgnored() {
        Product noEmbeddingProduct = new Product();
        noEmbeddingProduct.setEmbedding(null); // Missing embedding

        UserInteraction view = new UserInteraction();
        view.setInteractionType(InteractionType.VIEW);
        view.setProduct(noEmbeddingProduct);
        view.setCreatedAt(LocalDateTime.now());

        when(userInteractionService.getUserInteractions(testUser)).thenReturn(List.of(view));

        Optional<float[]> result = userPreferenceService.buildUserPreferenceVector(testUser);
        
        // Should be empty because the only interaction had no usable embedding
        assertFalse(result.isPresent());
        
        verify(productEmbeddingService, never()).generateProductEmbedding(any());
    }
}
