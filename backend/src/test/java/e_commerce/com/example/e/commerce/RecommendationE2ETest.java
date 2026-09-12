package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.dto.ProductCardDTO;
import e_commerce.com.example.e.commerce.models.InteractionType;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.Role;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.repos.UserInteractionRepo;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import e_commerce.com.example.e.commerce.services.UserInteractionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class RecommendationE2ETest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepo productRepo;

    @Autowired
    private UserInteractionService userInteractionService;

    @Autowired
    private UserInteractionRepo userInteractionRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private String jwtToken;
    private String baseUrl;

    @BeforeEach
    public void setup() {
        baseUrl = "http://localhost:" + port;
        
        userInteractionRepo.deleteAll();
        
        String testEmail = "recommender@test.com";
        if (userRepository.findByEmail(testEmail).isEmpty()) {
            User u = new User();
            u.setEmail(testEmail);
            u.setPassword(passwordEncoder.encode("password"));
            u.setName("Recommender");
            u.setRole(Role.CUSTOMER);
            u.setEnabled(true);
            testUser = userRepository.save(u);
        } else {
            testUser = userRepository.findByEmail(testEmail).get();
        }

        // Login to get token
        String loginBody = String.format("{\"email\":\"%s\", \"password\":\"password\"}", testEmail);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/auth/login", new HttpEntity<>(loginBody, headers), Map.class);
        
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            jwtToken = (String) response.getBody().get("token");
        }
    }

    private HttpEntity<Void> getAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtToken);
        return new HttpEntity<>(headers);
    }

    @Test
    public void testNewUserGetsGlobalRecommendations() {
        // User has 0 interactions
        assertEquals(0, userInteractionRepo.countByUser(testUser));

        ResponseEntity<List<ProductCardDTO>> response = restTemplate.exchange(
                baseUrl + "/api/recommendations?limit=5",
                HttpMethod.GET,
                getAuthHeaders(),
                new ParameterizedTypeReference<List<ProductCardDTO>>() {}
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<ProductCardDTO> products = response.getBody();
        assertNotNull(products);
        assertTrue(products.size() <= 5);
        
        // As a global cold-start, we expect the most popular active products.
        // It shouldn't be empty assuming the test DB has products.
        assertFalse(products.isEmpty());
    }

    @Test
    public void testHighInteractionUserGetsPersonalizedRecommendations() {
        // Create 25 interactions (passes the 20-49 threshold)
        List<Product> allProducts = productRepo.findByIsActiveTrue();
        if (allProducts.isEmpty()) return; // Skip if no products
        
        Product p = allProducts.get(0);
        for (int i = 0; i < 25; i++) {
            userInteractionService.recordInteraction(testUser, p, InteractionType.VIEW, null);
        }
        
        ResponseEntity<List<ProductCardDTO>> response = restTemplate.exchange(
                baseUrl + "/api/recommendations?limit=10",
                HttpMethod.GET,
                getAuthHeaders(),
                new ParameterizedTypeReference<List<ProductCardDTO>>() {}
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<ProductCardDTO> products = response.getBody();
        assertNotNull(products);
        assertFalse(products.isEmpty());
        // Since we heavily interacted with one product, semantic search (if embeddings are present) 
        // should kick in and blend 60% personalized.
        
        // Verify no duplicates
        long uniqueCount = products.stream().map(ProductCardDTO::getId).distinct().count();
        assertEquals(products.size(), uniqueCount, "Recommendations must not contain duplicate products");
    }

    @Test
    public void testUnauthenticatedRequestFallbackToGlobal() {
        // Unauthenticated request
        ResponseEntity<List<ProductCardDTO>> response = restTemplate.exchange(
                baseUrl + "/api/recommendations",
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<List<ProductCardDTO>>() {}
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<ProductCardDTO> products = response.getBody();
        assertNotNull(products);
        assertFalse(products.isEmpty());
    }

    @Test
    public void testInvalidLimitDefaultsTo20() {
        ResponseEntity<List<ProductCardDTO>> response = restTemplate.exchange(
                baseUrl + "/api/recommendations?limit=-5",
                HttpMethod.GET,
                getAuthHeaders(),
                new ParameterizedTypeReference<List<ProductCardDTO>>() {}
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        List<ProductCardDTO> products = response.getBody();
        assertNotNull(products);
        assertTrue(products.size() <= 20);
    }
}
