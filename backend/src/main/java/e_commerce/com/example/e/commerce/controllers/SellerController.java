package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.dto.RevenueResponse;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.OrderItem;
import e_commerce.com.example.e.commerce.services.ProductService;
import e_commerce.com.example.e.commerce.services.SellerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/seller")
public class SellerController {

    private final ProductService productService;
    private final SellerService sellerService;

    @Autowired
    public SellerController(ProductService productService, SellerService sellerService) {
        this.productService = productService;
        this.sellerService = sellerService;
    }

    private String getLoggedInUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getSellerProducts() {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(productService.getProductsBySellerEmail(email));
    }

    @GetMapping("/sales")
    public ResponseEntity<List<OrderItem>> getSellerSales() {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(sellerService.getSellerSales(email));
    }

    @GetMapping("/revenue")
    public ResponseEntity<RevenueResponse> getSellerRevenue() {
        String email = getLoggedInUserEmail();
        double revenue = sellerService.getSellerRevenue(email);
        return ResponseEntity.ok(new RevenueResponse(revenue));
    }
}
