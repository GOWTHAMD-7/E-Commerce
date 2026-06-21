package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@Transactional
public class FavoriteService {

    private final UserRepository userRepository;
    private final ProductRepo productRepo;

    @Autowired
    public FavoriteService(UserRepository userRepository, ProductRepo productRepo) {
        this.userRepository = userRepository;
        this.productRepo = productRepo;
    }

    public Set<Product> getFavoritesForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getFavorites();
    }

    public Set<Product> addFavorite(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        
        user.getFavorites().add(product);
        userRepository.save(user);
        return user.getFavorites();
    }

    public Set<Product> removeFavorite(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.getFavorites().removeIf(product -> product.getId().equals(productId));
        userRepository.save(user);
        return user.getFavorites();
    }
}
