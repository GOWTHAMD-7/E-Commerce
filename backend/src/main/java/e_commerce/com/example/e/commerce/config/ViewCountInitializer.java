package e_commerce.com.example.e.commerce.config;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Component
public class ViewCountInitializer implements CommandLineRunner {

    @Autowired
    private ProductRepo productRepo;

    private static final List<String> ELECTRONICS_ANGLES = List.of(
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&q=80",
        "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80"
    );

    private static final List<String> FASHION_ANGLES = List.of(
        "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80",
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80",
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
        "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80"
    );

    private static final List<String> HOME_ANGLES = List.of(
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&q=80",
        "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80",
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"
    );

    private static final List<String> GENERAL_ANGLES = List.of(
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80",
        "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80",
        "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80",
        "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80"
    );

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        try {
            List<Product> products = productRepo.findAll();
            if (products != null && !products.isEmpty()) {
                Random random = new Random();
                for (Product p : products) {
                    p.setViewCount((long) (random.nextInt(2950) + 50));

                    // If product has fewer than 2 images, seed distinct category angle images
                    if (p.getImages() == null || p.getImages().size() < 2) {
                        String cat = (p.getCategory() != null) ? p.getCategory().toLowerCase() : "";
                        List<String> pool;
                        if (cat.contains("electronic") || cat.contains("mobile") || cat.contains("camera")) {
                            pool = ELECTRONICS_ANGLES;
                        } else if (cat.contains("fashion") || cat.contains("cloth") || cat.contains("footwear")) {
                            pool = FASHION_ANGLES;
                        } else if (cat.contains("home") || cat.contains("kitchen") || cat.contains("living")) {
                            pool = HOME_ANGLES;
                        } else {
                            pool = GENERAL_ANGLES;
                        }

                        List<String> newImages = new java.util.ArrayList<>();
                        String main = (p.getMainImage() != null) ? p.getMainImage() : "";
                        if (!main.isEmpty()) {
                            newImages.add(main);
                        }

                        for (String angleUrl : pool) {
                            if (!newImages.contains(angleUrl) && newImages.size() < 4) {
                                newImages.add(angleUrl);
                            }
                        }

                        p.setImages(newImages);
                    }
                }
                productRepo.saveAll(products);
                System.out.println("⚡ Successfully randomized viewCount and populated distinct product angle images for " + products.size() + " products on startup!");
            }
        } catch (Exception e) {
            System.err.println("ViewCountInitializer failed: " + e.getMessage());
        }
    }
}
