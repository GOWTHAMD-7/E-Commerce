package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.repos.OrderRepository;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.Review;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.repos.ReviewRepository;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepo productRepo;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Autowired
    public ReviewService(ReviewRepository reviewRepository, ProductRepo productRepo, UserRepository userRepository, OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepo = productRepo;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    public Review addReview(String email, Long productId, int rating, String comment) {
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getSeller() != null && product.getSeller().getId().equals(user.getId())) {
            throw new RuntimeException("Sellers cannot review their own products");
        }

        boolean hasPurchased = orderRepository.existsByUserIdAndOrderItemsProductId(user.getId(), productId);
        if (!hasPurchased) {
            throw new RuntimeException("You must purchase this product before writing a review");
        }

        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setRating(rating);
        review.setComment(comment);

        Review savedReview = reviewRepository.save(review);

        // Recalculate average rating and review count
        List<Review> reviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        double totalRating = 0.0;
        for (Review r : reviews) {
            totalRating += r.getRating();
        }
        double averageRating = reviews.isEmpty() ? 0.0 : totalRating / reviews.size();

        product.setRating(averageRating);
        product.setReviewCount(reviews.size());
        productRepo.save(product);

        return savedReview;
    }

    public List<Review> getReviewsForProduct(Long productId) {
        if (!productRepo.existsById(productId)) {
            throw new RuntimeException("Product not found");
        }
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }
}
