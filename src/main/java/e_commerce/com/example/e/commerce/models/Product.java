package e_commerce.com.example.e.commerce.models;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Product {
    @Id
    @GeneratedValue
    Long id;
    @NonNull
    String name;
    String description;
    @NonNull
    Double price;
    @NonNull
    Integer stock;
    @NonNull
    String password;
}
