package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserEmailOrderByIdDesc(String email);
    boolean existsByUserIdAndOrderItemsProductId(Long userId, Long productId);
    List<Order> findByStatusAndOrderDateBefore(String status, java.time.LocalDateTime cutoff);
}
