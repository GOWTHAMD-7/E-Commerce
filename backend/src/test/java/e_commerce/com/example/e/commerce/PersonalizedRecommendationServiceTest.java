package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.dto.CandidateDTO;
import e_commerce.com.example.e.commerce.models.Order;
import e_commerce.com.example.e.commerce.models.OrderItem;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.CandidateProjection;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.services.OrderService;
import e_commerce.com.example.e.commerce.services.PersonalizedRecommendationService;
import e_commerce.com.example.e.commerce.services.UserPreferenceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class PersonalizedRecommendationServiceTest {

    @Mock
    private UserPreferenceService userPreferenceService;

    @Mock
    private ProductRepo productRepo;

    @Mock
    private OrderService orderService;

    private PersonalizedRecommendationService service;
    private User testUser;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        // limit = 5, excludePurchased = true
        service = new PersonalizedRecommendationService(userPreferenceService, productRepo, orderService, 5, true);
        
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@test.com");
    }

    // Custom Projection implementation for mocking
    private static class MockProjection implements CandidateProjection {
        private final Long id;
        private final Double similarity;

        public MockProjection(Long id, Double similarity) {
            this.id = id;
            this.similarity = similarity;
        }

        @Override public Long getId() { return id; }
        @Override public Double getSimilarity() { return similarity; }
    }

    @Test
    public void testUserWithNoPreferenceVectorReturnsEmpty() {
        when(userPreferenceService.buildUserPreferenceVector(testUser)).thenReturn(Optional.empty());

        List<CandidateDTO> candidates = service.getPersonalizedCandidates(testUser);
        
        assertTrue(candidates.isEmpty());
        verify(productRepo, never()).findPersonalizedCandidates(any(), any(), any(), anyInt());
    }

    @Test
    public void testValidPreferenceVectorExcludesPurchasedProducts() {
        float[] prefVector = new float[384];
        when(userPreferenceService.buildUserPreferenceVector(testUser)).thenReturn(Optional.of(prefVector));

        // Mock OrderService
        Order order = new Order();
        OrderItem item = new OrderItem();
        Product p = new Product();
        p.setId(99L);
        item.setProduct(p);
        order.setOrderItems(List.of(item));
        when(orderService.getUserOrders(testUser.getEmail())).thenReturn(List.of(order));

        // Mock Repo
        when(productRepo.findPersonalizedCandidates(eq(prefVector), eq(1L), argThat(list -> list.contains(99L)), eq(5)))
                .thenReturn(Collections.emptyList());

        List<CandidateDTO> candidates = service.getPersonalizedCandidates(testUser);

        assertTrue(candidates.isEmpty());
        // Verify that 99L was passed in the excluded list
        verify(productRepo, times(1)).findPersonalizedCandidates(any(), any(), argThat(list -> list.contains(99L)), anyInt());
    }

    @Test
    public void testValidPreferenceVectorReturnsOrderedCandidates() {
        float[] prefVector = new float[384];
        when(userPreferenceService.buildUserPreferenceVector(testUser)).thenReturn(Optional.of(prefVector));
        when(orderService.getUserOrders(anyString())).thenReturn(Collections.emptyList());

        List<CandidateProjection> mockProjections = Arrays.asList(
            new MockProjection(101L, 0.95),
            new MockProjection(102L, 0.85)
        );

        when(productRepo.findPersonalizedCandidates(any(), eq(1L), anyList(), eq(5)))
                .thenReturn(mockProjections);

        Product p101 = new Product(); p101.setId(101L);
        Product p102 = new Product(); p102.setId(102L);
        when(productRepo.findAllById(anyList())).thenReturn(Arrays.asList(p101, p102));

        List<CandidateDTO> candidates = service.getPersonalizedCandidates(testUser);

        assertEquals(2, candidates.size());
        
        // Assert order and values
        assertEquals(101L, candidates.get(0).getProduct().getId());
        assertEquals(0.95, candidates.get(0).getSimilarityScore(), 0.001);

        assertEquals(102L, candidates.get(1).getProduct().getId());
        assertEquals(0.85, candidates.get(1).getSimilarityScore(), 0.001);
    }
}
