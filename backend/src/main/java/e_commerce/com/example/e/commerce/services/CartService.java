package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.ProductCart;
import e_commerce.com.example.e.commerce.models.ProductSet;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.ProductCartRepository;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Optional;

@Service
@Transactional
public class CartService {

    private final ProductCartRepository cartRepository;
    private final ProductRepo productRepo;
    private final UserRepository userRepository;

    @Autowired
    public CartService(ProductCartRepository cartRepository, ProductRepo productRepo, UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.productRepo = productRepo;
        this.userRepository = userRepository;
    }

    public ProductCart getCartForUser(String email) {
        ProductCart cart = cartRepository.findByUserEmail(email)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(email)
                            .orElseThrow(() -> new RuntimeException("User not found"));
                    ProductCart newCart = new ProductCart();
                    newCart.setUser(user);
                    newCart.setCart(new ArrayList<>());
                    return cartRepository.save(newCart);
                });

        // Defensive self-healing check to merge any duplicate product sets in the database cart
        if (cart.getCart() != null && !cart.getCart().isEmpty()) {
            boolean hasDuplicates = false;
            java.util.List<ProductSet> uniqueItems = new ArrayList<>();
            for (ProductSet item : cart.getCart()) {
                if (item.getProduct() == null || item.getProduct().getId() == null) {
                    uniqueItems.add(item);
                    continue;
                }
                Optional<ProductSet> existing = uniqueItems.stream()
                        .filter(u -> u.getProduct() != null && item.getProduct().getId().equals(u.getProduct().getId()))
                        .findFirst();
                if (existing.isPresent()) {
                    existing.get().setQuantity(existing.get().getQuantity() + item.getQuantity());
                    hasDuplicates = true;
                } else {
                    uniqueItems.add(item);
                }
            }
            if (hasDuplicates) {
                cart.getCart().clear();
                cart.getCart().addAll(uniqueItems);
                cart = cartRepository.save(cart);
            }
        }

        return cart;
    }

    public ProductCart addToCart(String email, Long productId, int quantity) {
        ProductCart cart = getCartForUser(email);
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (product.getSeller() != null && product.getSeller().getId().equals(cart.getUser().getId())) {
            throw new RuntimeException("Sellers cannot purchase their own products");
        }

        if (product.getStock() < quantity) {
            throw new RuntimeException("Insufficient product stock");
        }

        Optional<ProductSet> existingItem = cart.getCart().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst();

        if (existingItem.isPresent()) {
            ProductSet item = existingItem.get();
            int newQty = item.getQuantity() + quantity;
            if (product.getStock() < newQty) {
                throw new RuntimeException("Insufficient product stock for requested quantity");
            }
            item.setQuantity(newQty);
        } else {
            ProductSet newItem = new ProductSet();
            newItem.setProduct(product);
            newItem.setQuantity(quantity);
            cart.getCart().add(newItem);
        }

        return cartRepository.save(cart);
    }

    public ProductCart updateCartItem(String email, Long productId, int quantity) {
        ProductCart cart = getCartForUser(email);

        ProductSet existingItem = cart.getCart().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Product not found in cart"));

        if (quantity <= 0) {
            cart.getCart().remove(existingItem);
        } else {
            Product product = existingItem.getProduct();
            if (product.getStock() < quantity) {
                throw new RuntimeException("Insufficient product stock");
            }
            existingItem.setQuantity(quantity);
        }

        return cartRepository.save(cart);
    }

    public ProductCart removeFromCart(String email, Long productId) {
        ProductCart cart = getCartForUser(email);
        cart.getCart().removeIf(item -> item.getProduct().getId().equals(productId));
        return cartRepository.save(cart);
    }

    public void clearCart(ProductCart cart) {
        cart.getCart().clear();
        cartRepository.save(cart);
    }
}
