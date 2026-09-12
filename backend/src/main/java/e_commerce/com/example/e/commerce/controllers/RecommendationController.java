package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.dto.FinalRecommendationDTO;
import e_commerce.com.example.e.commerce.dto.ProductCardDTO;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import e_commerce.com.example.e.commerce.services.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    @Autowired
    public RecommendationController(RecommendationService recommendationService, UserRepository userRepository) {
        this.recommendationService = recommendationService;
        this.userRepository = userRepository;
    }

    private User getAuthenticatedUser() {
        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            return null;
        }
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        if (email == null || email.equals("anonymousUser")) {
            return null;
        }
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt.orElse(null);
    }

    @GetMapping
    public ResponseEntity<List<ProductCardDTO>> getRecommendations(
            @RequestParam(name = "limit", required = false, defaultValue = "20") int limit) {
        
        if (limit <= 0 || limit > 100) {
            limit = 20; // enforce reasonable bounds
        }

        User user = getAuthenticatedUser();
        
        List<FinalRecommendationDTO> recommendations = recommendationService.getRecommendations(user);

        // Truncate to requested limit if necessary
        if (recommendations.size() > limit) {
            recommendations = recommendations.subList(0, limit);
        }

        List<ProductCardDTO> response = recommendations.stream()
                .map(rec -> mapToCardDTO(rec.getProduct()))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    private ProductCardDTO mapToCardDTO(Product p) {
        return ProductCardDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .price(p.getPrice())
                .discountedPrice(p.getDiscountedPrice())
                .discountPercent(p.getDiscountPercent())
                .mainImage(p.getMainImage())
                .images(p.getImages())
                .rating(p.getRating())
                .reviewCount(p.getReviewCount())
                .viewCount(p.getViewCount())
                .stock(p.getStock())
                .brand(p.getBrand())
                .category(p.getCategory())
                .subCategory(p.getSubCategory())
                .description(p.getDescription())
                .build();
    }
}
