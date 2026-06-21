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
    public ResponseEntity<Order> checkout(@RequestParam Long addressId) {
        String email = getLoggedInUserEmail();
        Order order = orderService.checkout(email, addressId);
        return ResponseEntity.ok(order);
    }

    @GetMapping
    public ResponseEntity<List<Order>> getUserOrders() {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(orderService.getUserOrders(email));
    }

    @PostMapping("/{orderId}/cancel-request")
    public ResponseEntity<String> cancelRequest(@PathVariable Long orderId) {
        String email = getLoggedInUserEmail();
        orderService.cancelRequest(email, orderId);
        return ResponseEntity.ok("Verification OTP code sent to your email.");
    }

    @PostMapping("/{orderId}/cancel-confirm")
    public ResponseEntity<String> cancelConfirm(@PathVariable Long orderId, @RequestParam String otp) {
        String email = getLoggedInUserEmail();
        orderService.cancelConfirm(email, orderId, otp);
        return ResponseEntity.ok("Order cancelled successfully.");
    }
}
