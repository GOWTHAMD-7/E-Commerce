package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.ProductCart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProductCartRepository extends JpaRepository<ProductCart, Long> {
    Optional<ProductCart> findByUserEmail(String email);
}
