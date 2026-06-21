package e_commerce.com.example.e.commerce.models;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.CascadeType;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

import java.util.List;
import java.util.ArrayList;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NonNull
    @Column(length = 500)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String category;
    private String brand;
    
    @NonNull
    private Double price;
    @NonNull
    private Integer stock;
    
    @ElementCollection
    @Column(length = 1000)
    private List<String> images = new ArrayList<>();



    @Column(columnDefinition = "TEXT")
    private String mainImage;
    private Double rating = 0.0;
    private Integer reviewCount = 0;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    @ManyToOne
    @JoinColumn(name = "seller_id")
    private User seller;
}
