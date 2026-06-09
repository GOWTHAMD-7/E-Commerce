package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {
    @Autowired
    private ProductRepo productRepo;

    public Product createProduct(Product newProduct) {
        return productRepo.save(newProduct);
    }

    public List<Product> getAllProducts()  {
        return productRepo.findAll();
    }

    public Product getProductById(Long id) {
        return productRepo.findById(id).orElse(null);
    }

    public void deletebyId(Long id) {
        productRepo.deleteById(id);
    }

    public Product updateProduct(Product newProduct) {
        return productRepo.save(newProduct);
    }
}
