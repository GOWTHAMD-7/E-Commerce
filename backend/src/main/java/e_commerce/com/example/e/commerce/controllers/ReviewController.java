package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.dto.ReviewRequest;
import e_commerce.com.example.e.commerce.models.Review;
import e_commerce.com.example.e.commerce.services.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @Autowired
    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    private String getLoggedInUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping("/products/{productId}")
    public ResponseEntity<?> addReview(@PathVariable Long productId, @RequestBody ReviewRequest request) {
        try {
            String email = getLoggedInUserEmail();
            Review review = reviewService.addReview(email, productId, request.getRating(), request.getComment());
            return new ResponseEntity<>(review, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/products/{productId}")
    public ResponseEntity<?> getReviews(@PathVariable Long productId) {
        try {
            List<Review> reviews = reviewService.getReviewsForProduct(productId);
            return ResponseEntity.ok(reviews);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
