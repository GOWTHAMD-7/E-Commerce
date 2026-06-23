package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.services.ProductService;
import e_commerce.com.example.e.commerce.services.CloudinaryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import e_commerce.com.example.e.commerce.models.Role;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.services.UserService;
import org.springframework.security.core.context.SecurityContextHolder;
import e_commerce.com.example.e.commerce.dto.MessageResponse;
import e_commerce.com.example.e.commerce.dto.ProductCardDTO;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;



@RestController
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private UserService userService;

    private String getLoggedInUserEmail() {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getName().equals("anonymousUser")) {
            return auth.getName();
        }
        return null;
    }

    @GetMapping("/products")
    public ResponseEntity<List<ProductCardDTO>> getProducts(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (query != null && !query.trim().isEmpty()) {
            return new ResponseEntity<>(productService.searchProducts(query), HttpStatus.ACCEPTED);
        }
        if (page != null) {
            int pageSize = (size != null) ? size : 50;
            return new ResponseEntity<>(productService.getProductsByPage(page, pageSize), HttpStatus.ACCEPTED);
        }
        return new ResponseEntity<>(productService.getAllProductsDTO(), HttpStatus.ACCEPTED);
    }

    @GetMapping("/products/featured")
    public ResponseEntity<List<ProductCardDTO>> getFeaturedProducts() {
        return new ResponseEntity<>(productService.getFeaturedProducts(), HttpStatus.ACCEPTED);
    }

    @GetMapping("/products/new-arrivals")
    public ResponseEntity<List<ProductCardDTO>> getNewArrivals() {
        return new ResponseEntity<>(productService.getNewArrivals(), HttpStatus.ACCEPTED);
    }

    @GetMapping("/products/top-rated")
    public ResponseEntity<List<ProductCardDTO>> getTopRated() {
        return new ResponseEntity<>(productService.getTopRatedProducts(), HttpStatus.ACCEPTED);
    }

    @GetMapping("/products/most-reviewed")
    public ResponseEntity<List<ProductCardDTO>> getMostReviewed() {
        return new ResponseEntity<>(productService.getMostReviewedProducts(), HttpStatus.ACCEPTED);
    }

    @GetMapping("/products/suggestions")
    public ResponseEntity<List<String>> getSuggestions(@RequestParam String query) {
        if (query == null || query.trim().isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        return ResponseEntity.ok(productService.getSuggestions(query));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return new ResponseEntity<Product>(productService.getProductById(id), HttpStatus.ACCEPTED);
    }

    @PostMapping("/products")
    public ResponseEntity<Product> createProduct(@RequestBody Product newProduct) {
        String email = getLoggedInUserEmail();
        User seller = email != null ? userService.findByEmail(email) : null;
        return new ResponseEntity<>(productService.createProduct(newProduct, seller), HttpStatus.CREATED);
    }

    @PostMapping(value = "/products", consumes = "multipart/form-data")
    public ResponseEntity<Product> createProductMultipart(
            @ModelAttribute Product product,
            @RequestParam(value = "image", required = false) MultipartFile image) throws java.io.IOException {
        String email = getLoggedInUserEmail();
        User seller = email != null ? userService.findByEmail(email) : null;
        if (image != null && !image.isEmpty()) {
            String mainImage = cloudinaryService.uploadImage(image);
            product.setMainImage(mainImage);
        }
        return new ResponseEntity<>(productService.createProduct(product, seller), HttpStatus.CREATED);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        String email = getLoggedInUserEmail();
        User user = userService.findByEmail(email);
        
        if (user.getRole() == Role.ADMIN) {
            product.setId(id);
            return ResponseEntity.ok(productService.updateProduct(product));
        } else {
            return ResponseEntity.ok(productService.updateSellerProduct(id, product, email));
        }
    }

    @PutMapping(value = "/products/{id}", consumes = "multipart/form-data")
    public ResponseEntity<Product> updateProductMultipart(
            @PathVariable Long id,
            @ModelAttribute Product product,
            @RequestParam(value = "image", required = false) MultipartFile image) throws Exception {
        String email = getLoggedInUserEmail();
        User user = userService.findByEmail(email);
        if (image != null && !image.isEmpty()) {
            String mainImage = cloudinaryService.uploadImage(image);
            product.setMainImage(mainImage);
        }
        
        if (user.getRole() == Role.ADMIN) {
            Product existing = productService.getProductById(id);
            if (existing == null) {
                throw new RuntimeException("Product not found");
            }
            existing.setName(product.getName());
            existing.setDescription(product.getDescription());
            existing.setCategory(product.getCategory());
            existing.setBrand(product.getBrand());
            existing.setPrice(product.getPrice());
            existing.setStock(product.getStock());
            existing.setImages(product.getImages());
            if (product.getMainImage() != null) {
                existing.setMainImage(product.getMainImage());
            }
            return ResponseEntity.ok(productService.updateProduct(existing));
        } else {
            return ResponseEntity.ok(productService.updateSellerProduct(id, product, email));
        }
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<MessageResponse> deleteProduct(@PathVariable Long id) {
        String email = getLoggedInUserEmail();
        User user = userService.findByEmail(email);
        
        if (user.getRole() == Role.ADMIN) {
            if (productService.deletebyId(id)) {
                return ResponseEntity.ok(new MessageResponse("Product deleted successfully by Admin"));
            } else {
                throw new RuntimeException("Product not found");
            }
        } else {
            productService.deleteSellerProduct(id, email);
            return ResponseEntity.ok(new MessageResponse("Product deleted successfully by Seller"));
        }
    }
}
