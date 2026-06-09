package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.dto.CartItemRequest;
import e_commerce.com.example.e.commerce.models.ProductCart;
import e_commerce.com.example.e.commerce.services.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartService cartService;

    @Autowired
    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    private String getLoggedInUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<ProductCart> getCart() {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(cartService.getCartForUser(email));
    }

    @PostMapping("/add")
    public ResponseEntity<ProductCart> addToCart(@RequestBody CartItemRequest request) {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(cartService.addToCart(email, request.getProductId(), request.getQuantity()));
    }

    @PutMapping("/update")
    public ResponseEntity<ProductCart> updateCartItem(@RequestBody CartItemRequest request) {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(cartService.updateCartItem(email, request.getProductId(), request.getQuantity()));
    }

    @DeleteMapping("/remove/{productId}")
    public ResponseEntity<ProductCart> removeFromCart(@PathVariable Long productId) {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(cartService.removeFromCart(email, productId));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<String> clearCart() {
        String email = getLoggedInUserEmail();
        ProductCart cart = cartService.getCartForUser(email);
        cartService.clearCart(cart);
        return ResponseEntity.ok("Cart cleared successfully");
    }
}
