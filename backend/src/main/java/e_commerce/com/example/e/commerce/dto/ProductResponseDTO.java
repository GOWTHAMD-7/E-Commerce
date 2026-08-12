package e_commerce.com.example.e.commerce.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ProductResponseDTO {

    private Long id;
    private String name;
    private String description;
    private String category;
    private String subCategory;
    private String brand;
    private Double price;
    private Double discountedPrice;
    private Integer discountPercent;
    private String fit;
    private String material;
    private String careInstructions;
    private List<String> images;
    private String mainImage;
    private Double rating;
    private Integer reviewCount;
    private Boolean isActive;
    private Boolean isFeatured;
    private Boolean isNewArrival;
    private LocalDateTime createdAt;
    private Integer stock;

}
