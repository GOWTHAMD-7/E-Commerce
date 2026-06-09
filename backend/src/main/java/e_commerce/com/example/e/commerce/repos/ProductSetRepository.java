package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.ProductSet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductSetRepository extends JpaRepository<ProductSet, Long> {
}
