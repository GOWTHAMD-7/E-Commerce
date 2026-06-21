package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.dto.RoleUpdateRequest;
import e_commerce.com.example.e.commerce.dto.SalesAnalyticsResponse;
import e_commerce.com.example.e.commerce.models.Order;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.services.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;

    @Autowired
    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/sellers")
    public ResponseEntity<List<User>> getAllSellers() {
        return ResponseEntity.ok(adminService.getAllSellers());
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestBody RoleUpdateRequest payload) {
        return ResponseEntity.ok(adminService.updateUserRole(id, payload));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders() {
        return ResponseEntity.ok(adminService.getAllOrders());
    }

    @GetMapping("/sales")
    public ResponseEntity<SalesAnalyticsResponse> getSalesAnalytics() {
        return ResponseEntity.ok(adminService.getSalesAnalytics());
    }
}
