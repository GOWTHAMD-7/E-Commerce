package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.models.Order;
import e_commerce.com.example.e.commerce.services.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    private String getLoggedInUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkout() {
        try {
            String email = getLoggedInUserEmail();
            Order order = orderService.checkout(email);
            return ResponseEntity.ok(order);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Order>> getUserOrders() {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(orderService.getUserOrders(email));
    }
}
