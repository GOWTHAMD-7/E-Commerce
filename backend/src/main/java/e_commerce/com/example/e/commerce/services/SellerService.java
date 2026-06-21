package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.OrderItem;
import e_commerce.com.example.e.commerce.repos.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SellerService {

    private final OrderItemRepository orderItemRepository;

    @Autowired
    public SellerService(OrderItemRepository orderItemRepository) {
        this.orderItemRepository = orderItemRepository;
    }

    public List<OrderItem> getSellerSales(String email) {
        return orderItemRepository.findByProductSellerEmail(email);
    }

    public double getSellerRevenue(String email) {
        List<OrderItem> sales = orderItemRepository.findByProductSellerEmail(email);
        return sales.stream()
                .mapToDouble(item -> item.getPurchasedPrice() * item.getQuantity())
                .sum();
    }
}
