package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.services.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping("/products/all")
    public ResponseEntity<List<Product>> getProducts() {
        return new ResponseEntity<List<Product>>(productService.getAllProducts(), HttpStatus.ACCEPTED);
    }

    @GetMapping("/product/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        return new ResponseEntity<Product>(productService.getProductById(id), HttpStatus.ACCEPTED);
    }

    @PostMapping("/createProduct")
    public ResponseEntity<Product> createProduct(@RequestBody Product newProduct) {
        return new ResponseEntity<Product>(productService.createProduct(newProduct), HttpStatus.CREATED);
    }

    @PutMapping("/updateProduct")
    public ResponseEntity<Product> updateProduct(@RequestBody Product newProduct) {
        return new ResponseEntity<Product>(productService.updateProduct(newProduct), HttpStatus.ACCEPTED);
    }

    @DeleteMapping("/deleteProduct/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable Long id) {
        productService.deletebyId(id);
        return new ResponseEntity<String>("Product with id " + id + " has been deleted.", HttpStatus.ACCEPTED);
    }

}
