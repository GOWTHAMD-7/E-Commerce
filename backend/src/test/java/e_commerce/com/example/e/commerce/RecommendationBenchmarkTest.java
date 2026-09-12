package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.models.InteractionType;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.Role;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.repos.UserInteractionRepo;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import e_commerce.com.example.e.commerce.services.RecommendationService;
import e_commerce.com.example.e.commerce.services.UserInteractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
public class RecommendationBenchmarkTest {

    private static final Logger log = LoggerFactory.getLogger(RecommendationBenchmarkTest.class);

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private UserInteractionService userInteractionService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private UserInteractionRepo userInteractionRepo;

    private User benchmarkUser;
    private List<Product> availableProducts;

    @BeforeEach
    public void setup() {
        userInteractionRepo.deleteAll();

        String email = "benchmark@test.com";
        if (userRepository.findByEmail(email).isEmpty()) {
            User u = new User();
            u.setEmail(email);
            u.setPassword("password");
            u.setName("Benchmark User");
            u.setRole(Role.CUSTOMER);
            benchmarkUser = userRepository.save(u);
        } else {
            benchmarkUser = userRepository.findByEmail(email).get();
        }

        availableProducts = productRepo.findByIsActiveTrue();
    }

    private void createInteractions(int count) {
        if (availableProducts.isEmpty()) return;
        Product p = availableProducts.get(0);
        for (int i = 0; i < count; i++) {
            userInteractionService.recordInteraction(benchmarkUser, p, InteractionType.VIEW, null);
        }
    }

    @Test
    public void runBenchmarks() {
        log.info("Starting Recommendation Benchmarks...");

        // 1. Cold Start (0 interactions)
        long start = System.currentTimeMillis();
        recommendationService.getRecommendations(benchmarkUser);
        long coldStartTime = System.currentTimeMillis() - start;
        log.info("Cold Start (0 interactions) took: {} ms", coldStartTime);

        // 2. Low Interactions (5)
        createInteractions(5);
        start = System.currentTimeMillis();
        recommendationService.getRecommendations(benchmarkUser);
        long lowTime = System.currentTimeMillis() - start;
        log.info("Low interactions (5) took: {} ms", lowTime);

        // 3. Medium Interactions (20)
        createInteractions(15); // Total 20
        start = System.currentTimeMillis();
        recommendationService.getRecommendations(benchmarkUser);
        long mediumTime = System.currentTimeMillis() - start;
        log.info("Medium interactions (20) took: {} ms", mediumTime);

        // 4. High Interactions (50)
        createInteractions(30); // Total 50
        start = System.currentTimeMillis();
        recommendationService.getRecommendations(benchmarkUser);
        long highTime = System.currentTimeMillis() - start;
        log.info("High interactions (50) took: {} ms", highTime);

        assertNotNull(benchmarkUser);
    }
}
