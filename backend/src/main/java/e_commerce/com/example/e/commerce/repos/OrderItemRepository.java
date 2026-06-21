package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByProductSellerEmail(String email);
    List<OrderItem> findByProductSellerId(Long sellerId);
}
