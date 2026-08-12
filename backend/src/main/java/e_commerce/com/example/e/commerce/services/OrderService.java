package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.*;
import e_commerce.com.example.e.commerce.repos.OrderRepository;
import e_commerce.com.example.e.commerce.repos.ProductRepo;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import e_commerce.com.example.e.commerce.repos.AddressRepository;
import e_commerce.com.example.e.commerce.repos.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDateTime;
import java.util.Random;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartService cartService;
    private final ProductRepo productRepo;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;

    @Autowired
    public OrderService(OrderRepository orderRepository, 
                        CartService cartService, 
                        ProductRepo productRepo, 
                        UserRepository userRepository, 
                        AddressRepository addressRepository,
                        VerificationTokenRepository verificationTokenRepository,
                        EmailService emailService) {
        this.orderRepository = orderRepository;
        this.cartService = cartService;
        this.productRepo = productRepo;
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.emailService = emailService;
    }

    public Order checkout(String email, Long addressId) {
        if (addressId == null) {
            throw new RuntimeException("Shipping address is required");
        }
        ProductCart cart = cartService.getCartForUser(email);
        if (cart.getCart() == null || cart.getCart().isEmpty()) {
            throw new RuntimeException("Cannot checkout an empty cart");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!address.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized address usage");
        }

        Order order = new Order();
        order.setUser(user);
        order.setShippingFullName(address.getFullName());
        order.setShippingPhoneNumber(address.getPhoneNumber());
        order.setShippingAddressLine1(address.getAddressLine1());
        order.setShippingAddressLine2(address.getAddressLine2());
        order.setShippingCity(address.getCity());
        order.setShippingState(address.getState());
        order.setShippingCountry(address.getCountry());
        order.setShippingPincode(address.getPincode());
        order.setStatus("PENDING");
        order.setOrderDate(LocalDateTime.now());
        order.setOrderItems(new ArrayList<>());

        for (ProductSet cartItem : cart.getCart()) {
            Product product = productRepo.findByIdForUpdate(cartItem.getProduct().getId())
                    .orElseThrow(() -> new RuntimeException("Product not found: " + cartItem.getProduct().getName()));

            if (product.getSeller() != null && product.getSeller().getId().equals(user.getId())) {
                throw new RuntimeException("Sellers cannot purchase their own products (" + product.getName() + ")");
            }

            if (product.getStock() < cartItem.getQuantity()) {
                throw new RuntimeException("Sorry, this product became unavailable while processing your order.");
            }

            // Decrement stock (TODO: Update to use ProductVariant)
            // product.setStock(product.getStock() - cartItem.getQuantity());
            // productRepo.save(product);

            // Create OrderItem
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPurchasedPrice(product.getPrice());

            order.getOrderItems().add(orderItem);
        }

        Order savedOrder = orderRepository.save(order);

        // Clear user's cart
        cartService.clearCart(cart);

        // Trigger order confirmation email
        try {
            emailService.sendOrderConfirmationEmail(user.getEmail(), savedOrder);
        } catch (Exception e) {
            System.err.println("[Error] Failed to send order confirmation email: " + e.getMessage());
        }

        return savedOrder;
    }

    public List<Order> getUserOrders(String email) {
        return orderRepository.findByUserEmailOrderByIdDesc(email);
    }

    @Transactional
    public void cancelRequest(String email, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized cancellation request");
        }

        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Order cannot be cancelled because it is already " + order.getStatus().toLowerCase());
        }

        // Validate 5-minute timeframe
        if (order.getOrderDate().plusMinutes(5).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Orders can only be cancelled within 5 minutes of purchase");
        }

        // Generate 6-digit OTP code
        Random random = new Random();
        String otp = String.format("%06d", random.nextInt(1000000));

        // Save or update cancellation OTP token (valid for 5 minutes)
        VerificationToken token = verificationTokenRepository.findByEmail(email)
                .orElse(new VerificationToken());
        token.setToken(otp);
        token.setEmail(email);
        token.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        verificationTokenRepository.save(token);

        // Send email
        emailService.sendCancellationRequestEmail(email, order, otp);
    }

    @Transactional
    public void cancelConfirm(String email, Long orderId, String otp) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getEmail().equals(email)) {
            throw new RuntimeException("Unauthorized cancellation confirmation");
        }

        if (!"PENDING".equals(order.getStatus())) {
            throw new RuntimeException("Order is not in pending state");
        }

        // Verify OTP code
        VerificationToken token = verificationTokenRepository.findByEmailAndToken(email, otp)
                .orElseThrow(() -> new RuntimeException("Invalid or expired verification code"));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            verificationTokenRepository.delete(token);
            throw new RuntimeException("Verification code has expired");
        }

        // Update order status to CANCELLED
        order.setStatus("CANCELLED");
        orderRepository.save(order);

            // Restore stock (TODO: Update to use ProductVariant)
            // product.setStock(product.getStock() + item.getQuantity());
            // productRepo.save(product);

        // Clean up token
        verificationTokenRepository.delete(token);

        // Send confirmation email
        emailService.sendOrderCancelledEmail(email, order);
    }

    @Scheduled(fixedDelay = 15000)
    @Transactional
    public void checkAndDeliverPendingOrders() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(5);
        List<Order> overdueOrders = orderRepository.findByStatusAndOrderDateBefore("PENDING", cutoff);
        for (Order order : overdueOrders) {
            order.setStatus("DELIVERED");
            orderRepository.save(order);
            emailService.sendOrderDeliveredEmail(order.getUser().getEmail(), order);
            System.out.println("Scheduled Delivery Scanner: Order #" + order.getId() + " marked as DELIVERED.");
        }
    }
}
