package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.dto.ProductCardDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Arrays;
import java.util.stream.Collectors;

@Service
public class ProductService {
    @Autowired
    private ProductRepo productRepo;

    public Product createProduct(Product newProduct) {
        return productRepo.save(newProduct);
    }

    public Product createProduct(Product newProduct, User seller) {
        newProduct.setSeller(seller);
        return productRepo.save(newProduct);
    }

    public List<Product> getAllProducts()  {
        return productRepo.findAll();
    }

    public List<Product> getProductsBySellerEmail(String email) {
        return productRepo.findBySellerEmail(email);
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

    public void deleteSellerProduct(Long id, String sellerEmail) {
        Product existing = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (existing.getSeller() == null || !existing.getSeller().getEmail().equals(sellerEmail)) {
            throw new RuntimeException("You do not own this product");
        }
        productRepo.delete(existing);
    }

    public Product updateProduct(Product newProduct) {
        return productRepo.save(newProduct);
    }

    public Product updateSellerProduct(Long id, Product updatedProduct, String sellerEmail) {
        Product existing = productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        if (existing.getSeller() == null || !existing.getSeller().getEmail().equals(sellerEmail)) {
            throw new RuntimeException("You do not own this product");
        }
        existing.setName(updatedProduct.getName());
        existing.setDescription(updatedProduct.getDescription());
        existing.setCategory(updatedProduct.getCategory());
        existing.setBrand(updatedProduct.getBrand());
        existing.setPrice(updatedProduct.getPrice());
        existing.setStock(updatedProduct.getStock());
        existing.setImages(updatedProduct.getImages());
        if (updatedProduct.getMainImage() != null) {
            existing.setMainImage(updatedProduct.getMainImage());
        }
        return productRepo.save(existing);
    }

    public ProductCardDTO convertToDTO(Product product) {
        if (product == null) return null;
        return new ProductCardDTO(
            product.getId(),
            product.getName(),
            product.getPrice(),
            product.getMainImage(),
            product.getRating(),
            product.getReviewCount(),
            product.getStock(),
            product.getBrand(),
            product.getCategory(),
            product.getDescription()
        );
    }

    public List<ProductCardDTO> getFeaturedProducts() {
        return productRepo.findRandomProducts(20).stream()
            .map(this::convertToDTO)
            .toList();
    }

    public List<ProductCardDTO> getNewArrivals() {
        return productRepo.findTop20ByOrderByIdDesc().stream()
            .map(this::convertToDTO)
            .toList();
    }

    public List<ProductCardDTO> getTopRatedProducts() {
        return productRepo.findTop20ByOrderByRatingDesc().stream()
            .map(this::convertToDTO)
            .toList();
    }

    public List<ProductCardDTO> getMostReviewedProducts() {
        return productRepo.findTop20ByOrderByReviewCountDesc().stream()
            .map(this::convertToDTO)
            .toList();
    }

    public List<ProductCardDTO> getProductsByPage(int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        return productRepo.findAll(pageable).getContent().stream()
            .map(this::convertToDTO)
            .toList();
    }

    public List<ProductCardDTO> searchProducts(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }

        // Format terms: "nike running" -> "nike:* & running:*" for prefix searching
        String formattedQuery = Arrays.stream(query.trim().split("\\s+"))
            .filter(word -> !word.isEmpty())
            .map(word -> word.replaceAll("[^a-zA-Z0-9]", "") + ":*")
            .filter(word -> !word.equals(":*"))
            .collect(Collectors.joining(" & "));

        if (formattedQuery.isEmpty()) {
            return List.of();
        }

        List<Product> results = productRepo.searchProductsFTS(formattedQuery, query.trim());
        return results.stream()
            .map(this::convertToDTO)
            .toList();
    }

    public List<ProductCardDTO> getAllProductsDTO() {
        return productRepo.findAll().stream()
            .map(this::convertToDTO)
            .toList();
    }

    public List<String> getAllCategories() {
        return productRepo.findDistinctCategories();
    }

    private int getRelevanceScore(Product product, String query) {
        String name = product.getName() != null ? product.getName().toLowerCase() : "";
        String brand = product.getBrand() != null ? product.getBrand().toLowerCase() : "";
        String category = product.getCategory() != null ? product.getCategory().toLowerCase() : "";
        String desc = product.getDescription() != null ? product.getDescription().toLowerCase() : "";

        if (name.startsWith(query)) return 1;
        if (name.contains(query)) return 2;
        if (brand.contains(query)) return 3;
        if (category.contains(query)) return 4;
        if (desc.contains(query)) return 5;
        
        return 6;
    }

    public List<String> getSuggestions(String query) {
        String q = query.toLowerCase();
        List<Product> products = productRepo.findAll();
        
        return products.stream()
            .filter(product ->
                (product.getName() != null && product.getName().toLowerCase().contains(q)) ||
                (product.getBrand() != null && product.getBrand().toLowerCase().contains(q)) ||
                (product.getCategory() != null && product.getCategory().toLowerCase().contains(q))
            )
            .sorted((p1, p2) -> Integer.compare(getRelevanceScore(p1, q), getRelevanceScore(p2, q)))
            .map(product -> {
                String name = product.getName() != null ? product.getName() : "";
                if (name.toLowerCase().contains(q)) return name;
                
                String brand = product.getBrand() != null ? product.getBrand() : "";
                if (brand.toLowerCase().contains(q)) return brand;
                
                String category = product.getCategory() != null ? product.getCategory() : "";
                return category;
            })
            .distinct()
            .limit(10)
            .toList();
    }
}
