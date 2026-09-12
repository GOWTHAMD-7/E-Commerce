package e_commerce.com.example.e.commerce.dto;

import e_commerce.com.example.e.commerce.models.Product;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FinalRecommendationDTO {
    private Product product;
    private Double finalScore;
}
