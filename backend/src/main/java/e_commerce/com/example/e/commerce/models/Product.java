package e_commerce.com.example.e.commerce.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 500)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;

    private String subCategory;

    private String brand;

    @Column(nullable = false)
    private Double price;

    private Double discountedPrice;

    private Integer discountPercent;

    private String fit;

    private String material;

    private String careInstructions;

    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    @Column(name = "image_url", length = 1000)
    @Builder.Default
    private List<String> images = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String mainImage;

    @Builder.Default
    private Double rating = 0.0;
    @Builder.Default
    private Integer reviewCount = 0;

    @Builder.Default
    private Long viewCount = 0L;

    @Builder.Default
    private Integer stock = 0;

    @Builder.Default
    private Boolean isActive = true;
    @Builder.Default
    private Boolean isFeatured = false;
    @Builder.Default
    private Boolean isNewArrival = false;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Review> reviews = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "favorites", "addresses"})
    private User seller;
}
