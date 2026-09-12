package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.models.InteractionType;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.models.UserInteraction;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import e_commerce.com.example.e.commerce.services.UserInteractionService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class UserInteractionServiceTest {

    @Autowired
    private UserInteractionService userInteractionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepo productRepo;

    @Test
    @Transactional
    public void testInteractionRecordingAndLimits() {
        User user = userRepository.findById(1L).orElseThrow();
        Product product = productRepo.findById(1L).orElseThrow();

        // Record a search (null product, has query)
        userInteractionService.recordInteraction(user, null, InteractionType.SEARCH, "test query");

        // Record a view
        userInteractionService.recordInteraction(user, product, InteractionType.VIEW, null);

        // Record a wishlist
        userInteractionService.recordInteraction(user, product, InteractionType.WISHLIST, null);

        // Record a cart
        userInteractionService.recordInteraction(user, product, InteractionType.CART, null);

        // Record a purchase
        userInteractionService.recordInteraction(user, product, InteractionType.PURCHASE, null);

        List<UserInteraction> interactions = userInteractionService.getUserInteractions(user);
        
        // At least 5 were just added, so size should be >= 5
        assertTrue(interactions.size() >= 5);
        
        // Verify types
        boolean hasSearch = false, hasView = false, hasCart = false;
        for (UserInteraction ui : interactions) {
            if (ui.getInteractionType() == InteractionType.SEARCH) {
                assertNull(ui.getProduct());
                assertEquals("test query", ui.getSearchQuery());
                assertEquals(2, ui.getWeight());
                hasSearch = true;
            } else if (ui.getInteractionType() == InteractionType.VIEW) {
                assertNotNull(ui.getProduct());
                assertEquals(1, ui.getWeight());
                hasView = true;
            } else if (ui.getInteractionType() == InteractionType.CART) {
                assertEquals(4, ui.getWeight());
                hasCart = true;
            }
        }

        assertTrue(hasSearch);
        assertTrue(hasView);
        assertTrue(hasCart);

        // Test 50 limit enforcement
        for (int i = 0; i < 55; i++) {
            userInteractionService.recordInteraction(user, product, InteractionType.VIEW, null);
        }

        interactions = userInteractionService.getUserInteractions(user);
        assertEquals(50, interactions.size(), "Limit should be exactly 50 after exceeding");
    }
}
