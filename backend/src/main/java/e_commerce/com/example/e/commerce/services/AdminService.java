package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.dto.RoleUpdateRequest;
import e_commerce.com.example.e.commerce.dto.SalesAnalyticsResponse;
import e_commerce.com.example.e.commerce.models.Order;
import e_commerce.com.example.e.commerce.models.OrderItem;
import e_commerce.com.example.e.commerce.models.Role;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.OrderItemRepository;
import e_commerce.com.example.e.commerce.repos.OrderRepository;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AdminService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Autowired
    public AdminService(UserRepository userRepository, OrderRepository orderRepository, OrderItemRepository orderItemRepository) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getAllSellers() {
        return userRepository.findByRole(Role.SELLER);
    }

    public User updateUserRole(Long id, RoleUpdateRequest payload) {
        String roleStr = payload.getRole();
        if (roleStr == null || roleStr.trim().isEmpty()) {
            throw new RuntimeException("Role field is required");
        }
        Role newRole;
        try {
            newRole = Role.valueOf(roleStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role. Must be CUSTOMER, SELLER, or ADMIN");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(newRole);
        return userRepository.save(user);
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public SalesAnalyticsResponse getSalesAnalytics() {
        List<OrderItem> orderItems = orderItemRepository.findAll();
        double totalRevenue = orderItems.stream()
                .mapToDouble(item -> item.getPurchasedPrice() * item.getQuantity())
                .sum();
        long totalItemsSold = orderItems.stream()
                .mapToLong(OrderItem::getQuantity)
                .sum();
        long totalOrdersCount = orderRepository.count();

        return new SalesAnalyticsResponse(totalRevenue, totalItemsSold, totalOrdersCount);
    }
}
