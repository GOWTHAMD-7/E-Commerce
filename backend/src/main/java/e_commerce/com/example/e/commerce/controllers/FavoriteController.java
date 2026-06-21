package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.services.FavoriteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @Autowired
    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    private String getLoggedInUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<Set<Product>> getFavorites() {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(favoriteService.getFavoritesForUser(email));
    }

    @PostMapping("/add/{productId}")
    public ResponseEntity<Set<Product>> addFavorite(@PathVariable Long productId) {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(favoriteService.addFavorite(email, productId));
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<Set<Product>> removeFavorite(@PathVariable Long productId) {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(favoriteService.removeFavorite(email, productId));
    }
}
