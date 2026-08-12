package e_commerce.com.example.e.commerce.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.util.List;

@Data
public class ProductRequestDTO {

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    @NotNull(message = "Category is required")
    private String category;

    private String subCategory;
    private String brand;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private Double price;

    private Double discountedPrice;
    private Integer discountPercent;

    private String fit;
    private String material;
    private String careInstructions;

    private List<String> images;
    private String mainImage;

    private Boolean isFeatured;
    private Boolean isNewArrival;

    @NotNull
    @Min(0)
    private Integer stock;
}
