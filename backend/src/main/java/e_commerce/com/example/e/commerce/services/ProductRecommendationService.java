package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class ProductRecommendationService {

    @Autowired
    private ProductRepo productRepo;

    public List<Product> getSimilarProducts(Long productId, int limit) {
        if (limit <= 0) {
            return Collections.emptyList();
        }
        
        // Prevent abuse by capping the maximum recommendations requested
        int actualLimit = Math.min(limit, 20);

        Optional<Product> optionalProduct = productRepo.findById(productId);
        if (optionalProduct.isEmpty()) {
            throw new IllegalArgumentException("Product not found with id: " + productId);
        }

        Product product = optionalProduct.get();
        if (product.getEmbedding() == null) {
            return Collections.emptyList();
        }

        if (product.getIsActive() != null && !product.getIsActive()) {
            throw new IllegalArgumentException("Cannot recommend products for an inactive product");
        }

        return productRepo.findRecommendations(product.getEmbedding(), productId, actualLimit);
    }
}
