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

    public boolean deletebyId(Long id) {

        try {
            productRepo.findById(id).orElseThrow(() -> new RuntimeException("Product with id " + id + " not found."));
            productRepo.deleteById(id);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    public Product updateProduct(Product newProduct) {
        return productRepo.save(newProduct);
    }

    public List<Product> getProductsByPage(int page) {
        List<Product> products = productRepo.findAll();
        int size = 5;
        int fromIndex = (page - 1) * size;
        int toIndex = Math.min(fromIndex + size, products.size());
        if (fromIndex >= products.size()) {
            return List.of();
        }
        return products.subList(fromIndex, toIndex);
    }

    public List<Product> searchProducts(String query) {
        List<Product> products = productRepo.findAll();
        return products.stream()
                .filter(product -> product.getName().toLowerCase().contains(query.toLowerCase()))
                .filter(product -> product.getDescription().toLowerCase().contains(query.toLowerCase()))
                .toList();
    }
}
