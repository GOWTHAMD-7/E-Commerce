package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.dto.CandidateDTO;
import e_commerce.com.example.e.commerce.dto.FinalRecommendationDTO;
import e_commerce.com.example.e.commerce.dto.GlobalCandidateDTO;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.services.GlobalRecommendationService;
import e_commerce.com.example.e.commerce.services.PersonalizedRecommendationService;
import e_commerce.com.example.e.commerce.services.RecommendationService;
import e_commerce.com.example.e.commerce.services.UserInteractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class RecommendationServiceTest {

    @Mock
    private UserInteractionService userInteractionService;

    @Mock
    private PersonalizedRecommendationService personalizedRecommendationService;

    @Mock
    private GlobalRecommendationService globalRecommendationService;

    private RecommendationService recommendationService;

    private User testUser;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        // limit = 10, pool-multiplier = 2.0
        recommendationService = new RecommendationService(
                userInteractionService,
                personalizedRecommendationService,
                globalRecommendationService,
                10,
                2.0
        );

        testUser = new User();
        testUser.setId(1L);
    }

    private Product createProduct(Long id) {
        Product p = new Product();
        p.setId(id);
        return p;
    }

    @Test
    public void testColdStartUserGetsOnlyGlobal() {
        when(userInteractionService.getInteractionCount(testUser)).thenReturn(3L);

        Product p1 = createProduct(1L);
        GlobalCandidateDTO g1 = new GlobalCandidateDTO(p1, 5.0);

        when(globalRecommendationService.getGlobalCandidates(10)).thenReturn(Collections.singletonList(g1));

        List<FinalRecommendationDTO> results = recommendationService.getRecommendations(testUser);

        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getProduct().getId());
        assertEquals(5.0, results.get(0).getFinalScore());

        verify(personalizedRecommendationService, never()).getPersonalizedCandidates(any());
    }

    @Test
    public void testHighInteractionUserGetsBlendAndDeduplication() {
        when(userInteractionService.getInteractionCount(testUser)).thenReturn(55L); // 80% P / 20% G

        Product p1 = createProduct(1L); // In both
        Product p2 = createProduct(2L); // In personalized only
        Product p3 = createProduct(3L); // In global only

        CandidateDTO c1 = new CandidateDTO(p1, 0.9); // max p
        CandidateDTO c2 = new CandidateDTO(p2, 0.4); // min p

        GlobalCandidateDTO g1 = new GlobalCandidateDTO(p1, 10.0); // min g
        GlobalCandidateDTO g3 = new GlobalCandidateDTO(p3, 20.0); // max g

        when(personalizedRecommendationService.getPersonalizedCandidates(testUser)).thenReturn(Arrays.asList(c1, c2));
        when(globalRecommendationService.getGlobalCandidates(20)).thenReturn(Arrays.asList(g3, g1)); // 10 * 2.0 pool size

        List<FinalRecommendationDTO> results = recommendationService.getRecommendations(testUser);

        // 3 unique products expected
        assertEquals(3, results.size());

        // Calculations for Product 1 (in both):
        // pMin=0.4, pMax=0.9 => P norm for p1 = (0.9-0.4)/0.5 = 1.0
        // gMin=10.0, gMax=20.0 => G norm for p1 = (10-10)/10 = 0.0
        // Final Score for p1 = (0.8 * 1.0) + (0.2 * 0.0) = 0.8

        // Calculations for Product 2 (P only):
        // P norm for p2 = (0.4-0.4)/0.5 = 0.0
        // G norm for p2 = missing = 0.0
        // Final Score for p2 = (0.8 * 0.0) + (0.2 * 0.0) = 0.0

        // Calculations for Product 3 (G only):
        // P norm for p3 = missing = 0.0
        // G norm for p3 = (20-10)/10 = 1.0
        // Final Score for p3 = (0.8 * 0.0) + (0.2 * 1.0) = 0.2

        // Sort order should be: p1 (0.8), p3 (0.2), p2 (0.0)
        assertEquals(1L, results.get(0).getProduct().getId());
        assertEquals(0.8, results.get(0).getFinalScore(), 0.01);

        assertEquals(3L, results.get(1).getProduct().getId());
        assertEquals(0.2, results.get(1).getFinalScore(), 0.01);

        assertEquals(2L, results.get(2).getProduct().getId());
        assertEquals(0.0, results.get(2).getFinalScore(), 0.01);
    }
}
