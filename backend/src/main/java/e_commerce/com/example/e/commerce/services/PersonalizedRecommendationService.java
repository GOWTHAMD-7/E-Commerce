package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.dto.CandidateDTO;
import e_commerce.com.example.e.commerce.models.Order;
import e_commerce.com.example.e.commerce.models.OrderItem;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.CandidateProjection;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class PersonalizedRecommendationService {

    private final UserPreferenceService userPreferenceService;
    private final ProductRepo productRepo;
    private final OrderService orderService;
    
    private final int candidateLimit;
    private final boolean excludePurchased;

    @Autowired
    public PersonalizedRecommendationService(
            UserPreferenceService userPreferenceService,
            ProductRepo productRepo,
            OrderService orderService,
            @Value("${recommendation.personalized-candidate-limit:50}") int candidateLimit,
            @Value("${recommendation.exclude-purchased:true}") boolean excludePurchased) {
        this.userPreferenceService = userPreferenceService;
        this.productRepo = productRepo;
        this.orderService = orderService;
        this.candidateLimit = candidateLimit;
        this.excludePurchased = excludePurchased;
    }

    /**
     * Retrieves a list of candidate products based on the user's semantic preference vector.
     */
    public List<CandidateDTO> getPersonalizedCandidates(User user) {
        if (user == null) {
            return Collections.emptyList();
        }

        // 1. Build the 384-dimensional preference vector
        Optional<float[]> preferenceVectorOpt = userPreferenceService.buildUserPreferenceVector(user);
        if (preferenceVectorOpt.isEmpty()) {
            // No usable interaction history
            return Collections.emptyList();
        }
        
        float[] preferenceVector = preferenceVectorOpt.get();

        // 2. Identify products to exclude (e.g., already purchased)
        List<Long> excludedIds = new ArrayList<>();
        if (excludePurchased) {
            List<Order> userOrders = orderService.getUserOrders(user.getEmail());
            for (Order order : userOrders) {
                if (order.getOrderItems() != null) {
                    for (OrderItem item : order.getOrderItems()) {
                        if (item.getProduct() != null) {
                            excludedIds.add(item.getProduct().getId());
                        }
                    }
                }
            }
        }

        // 3. Retrieve candidates via vector search
        List<CandidateProjection> projections = productRepo.findPersonalizedCandidates(
                preferenceVector, 
                user.getId(), 
                excludedIds, 
                candidateLimit
        );

        if (projections.isEmpty()) {
            return Collections.emptyList();
        }

        // 4. Fetch the full Product entities
        List<Long> productIds = projections.stream()
                .map(CandidateProjection::getId)
                .collect(Collectors.toList());
                
        Map<Long, Product> productMap = productRepo.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // 5. Assemble final candidates preserving the cosine similarity order
        List<CandidateDTO> candidates = new ArrayList<>();
        for (CandidateProjection proj : projections) {
            Product p = productMap.get(proj.getId());
            if (p != null) {
                candidates.add(new CandidateDTO(p, proj.getSimilarity()));
            }
        }

        return candidates;
    }
}
