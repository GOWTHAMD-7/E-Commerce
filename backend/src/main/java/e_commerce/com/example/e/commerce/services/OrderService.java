package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.*;
import e_commerce.com.example.e.commerce.repos.OrderRepository;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final ProductRepo productRepo;
    private final UserRepository userRepository;

    @Autowired
    public OrderService(OrderRepository orderRepository, CartService cartService, ProductRepo productRepo, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.cartService = cartService;
        this.productRepo = productRepo;
        this.userRepository = userRepository;
    }

    public Order checkout(String email) {
        ProductCart cart = cartService.getCartForUser(email);
        if (cart.getCart() == null || cart.getCart().isEmpty()) {
            throw new RuntimeException("Cannot checkout an empty cart");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Order order = new Order();
        order.setUser(user);
        order.setOrderItems(new ArrayList<>());

        for (ProductSet cartItem : cart.getCart()) {
            Product product = productRepo.findById(cartItem.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + cartItem.getProduct().getName()));

            if (product.getStock() < cartItem.getQuantity()) {
                throw new RuntimeException("Insufficient stock for product: " + product.getName());
            }

            // Decrement stock
            product.setStock(product.getStock() - cartItem.getQuantity());
            productRepo.save(product);

            // Create OrderItem
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPurchasedPrice(product.getPrice());

            order.getOrderItems().add(orderItem);
        }

        Order savedOrder = orderRepository.save(order);

        // Clear user's cart
        cartService.clearCart(cart);

        return savedOrder;
    }

    public List<Order> getUserOrders(String email) {
        return orderRepository.findByUserEmailOrderByIdDesc(email);
    }
}
