package e_commerce.com.example.e.commerce.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductCardDTO {
    private Long id;
    private String name;
    private Double price;
    private String mainImage;
    private Double rating;
    private Integer reviewCount;
    private Integer stock;
    private String brand;
    private String category;
    private String description;
}
