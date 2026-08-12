package e_commerce.com.example.e.commerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProductCardDTO {
    private Long id;
    private String name;
    private Double price;
    private Double discountedPrice;
    private Integer discountPercent;
    private String mainImage;
    private java.util.List<String> images;
    private Double rating;
    private Integer reviewCount;
    private Long viewCount;
    private Integer stock;
    private String brand;
    private String category;
    private String subCategory;
    private String description;
}
