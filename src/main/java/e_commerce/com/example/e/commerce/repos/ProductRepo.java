package e_commerce.com.example.e.commerce.repos;
import e_commerce.com.example.e.commerce.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;


public interface ProductRepo extends JpaRepository<Product, Long> {

}

