package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.dto.GlobalCandidateDTO;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.services.GlobalRecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class GlobalRecommendationServiceTest {

    @Mock
    private ProductRepo productRepo;

    private GlobalRecommendationService service;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        service = new GlobalRecommendationService(
                productRepo, 
                5,    // limit
                0.5,  // weightRating
                0.3,  // weightPopularity
                0.1,  // weightFeatured
                0.1,  // weightNewArrival
                10.0, // bayesian prior
                3.5   // bayesian mean
        );
    }

    private Product createProduct(Long id, Double rating, Integer reviewCount, Long viewCount, Boolean isFeatured, Boolean isNewArrival) {
        Product p = new Product();
        p.setId(id);
        p.setRating(rating);
        p.setReviewCount(reviewCount);
        p.setViewCount(viewCount);
        p.setIsFeatured(isFeatured);
        p.setIsNewArrival(isNewArrival);
        return p;
    }

    @Test
    public void testBayesianRatingProtectsAgainstSingleHighRating() {
        // Product 1: One single 5-star review
        Product p1 = createProduct(1L, 5.0, 1, 100L, false, false);
        // Product 2: Hundreds of solid 4.5-star reviews
        Product p2 = createProduct(2L, 4.5, 500, 100L, false, false);

        double score1 = service.calculateGlobalScore(p1);
        double score2 = service.calculateGlobalScore(p2);

        // Product 2 should win because the Bayesian average pulls Product 1 down towards the 3.5 mean
        assertTrue(score2 > score1, "Highly reviewed 4.5 star should beat a single 5.0 star");
    }

    @Test
    public void testFeaturedAndNewArrivalBoost() {
        Product base = createProduct(1L, 4.0, 50, 100L, false, false);
        Product boosted = createProduct(2L, 4.0, 50, 100L, true, true);

        double scoreBase = service.calculateGlobalScore(base);
        double scoreBoosted = service.calculateGlobalScore(boosted);

        assertTrue(scoreBoosted > scoreBase, "Featured/New Arrival should provide a measurable boost");
    }

    @Test
    public void testLogarithmicViewCountScaling() {
        // Product 1: 1,000 views
        Product p1 = createProduct(1L, 4.0, 50, 1000L, false, false);
        // Product 2: 10,000 views
        Product p2 = createProduct(2L, 4.0, 50, 10000L, false, false);
        // Product 3: 100,000 views
        Product p3 = createProduct(3L, 4.0, 50, 100000L, false, false);

        double score1 = service.calculateGlobalScore(p1);
        double score2 = service.calculateGlobalScore(p2);
        double score3 = service.calculateGlobalScore(p3);

        assertTrue(score2 > score1);
        assertTrue(score3 > score2);
        
        // Ensure the increase from 10k to 100k doesn't dwarf the baseline
        assertTrue((score3 - score2) < (score2 - score1) * 2, "Logarithmic scale should dampen extreme values");
    }

    @Test
    public void testGetGlobalCandidatesLimitsAndSortsCorrectly() {
        Product p1 = createProduct(1L, 3.0, 10, 10L, false, false);
        Product p2 = createProduct(2L, 4.5, 500, 10000L, true, true); // Definite winner
        Product p3 = createProduct(3L, 4.0, 100, 1000L, false, false);
        Product p4 = createProduct(4L, 2.0, 5, 5L, false, false); // Definite loser
        Product p5 = createProduct(5L, 3.5, 50, 500L, false, false);
        Product p6 = createProduct(6L, 3.5, 50, 500L, false, false); // Tie with p5

        when(productRepo.findByIsActiveTrue()).thenReturn(Arrays.asList(p1, p2, p3, p4, p5, p6));

        // Limit is 5
        List<GlobalCandidateDTO> candidates = service.getGlobalCandidates();

        assertEquals(5, candidates.size(), "Should respect the candidate limit of 5");
        
        // Best product should be first
        assertEquals(2L, candidates.get(0).getProduct().getId());
        
        // Worst product (p4) should be truncated since it's 6th
        assertFalse(candidates.stream().anyMatch(c -> c.getProduct().getId() == 4L));

        // Test deterministic tie-breaking (p6 should be before p5 due to ID DESC)
        int idx5 = -1, idx6 = -1;
        for (int i = 0; i < candidates.size(); i++) {
            if (candidates.get(i).getProduct().getId() == 5L) idx5 = i;
            if (candidates.get(i).getProduct().getId() == 6L) idx6 = i;
        }
        assertTrue(idx6 < idx5, "Tie breaks should resolve deterministically by ID DESC");
    }
}
