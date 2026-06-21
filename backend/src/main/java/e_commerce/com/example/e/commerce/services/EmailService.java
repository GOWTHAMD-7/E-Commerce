package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Order;
import e_commerce.com.example.e.commerce.models.OrderItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.enabled:false}")
    private boolean mailEnabled;

    @PostConstruct
    public void init() {
        System.out.println("=================================================");
        System.out.println("EmailService Initialized:");
        System.out.println("  spring.mail.enabled (mailEnabled): " + mailEnabled);
        System.out.println("  JavaMailSender bean exists: " + (mailSender != null));
        System.out.println("=================================================");
    }

    public void sendOtpEmail(String toEmail, String otp) {
        System.out.println("=================================================");
        System.out.println("VERIFICATION OTP FOR " + toEmail + ": " + otp);
        System.out.println("=================================================");
        
        String body = "Thank you for registering on our E-Commerce marketplace!\n\n" +
                      "Please enter the following OTP code to verify your account:\n\n" +
                      "Verification OTP: " + otp + "\n\n" +
                      "This code is valid for 5 minutes. If you did not request this registration, please ignore this email.\n\n" +
                      "Best regards,\nE-Commerce Team";
                      
        sendEmail(toEmail, "Verify your email - E-Commerce OTP Verification", body);
    }

    public void sendOrderConfirmationEmail(String toEmail, Order order) {
        StringBuilder itemsSummary = new StringBuilder();
        double total = 0;
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                double itemTotal = item.getPurchasedPrice() * item.getQuantity();
                total += itemTotal;
                itemsSummary.append("- ").append(item.getProduct().getName())
                            .append(" x").append(item.getQuantity())
                            .append(" ($").append(String.format("%.2f", item.getPurchasedPrice())).append(" each) - $")
                            .append(String.format("%.2f", itemTotal)).append("\n");
            }
        }

        String body = "Thank you for your purchase! Your order has been placed successfully.\n\n" +
                      "Order Details:\n" +
                      "Order ID: #" + order.getId() + "\n" +
                      "Status: " + order.getStatus() + "\n" +
                      "Order Date: " + order.getOrderDate() + "\n\n" +
                      "Items:\n" + itemsSummary.toString() + "\n" +
                      "Total Price: $" + String.format("%.2f", total) + "\n\n" +
                      "Shipping Address:\n" +
                      "  Name: " + order.getShippingFullName() + "\n" +
                      "  Address: " + order.getShippingAddressLine1() + (order.getShippingAddressLine2() != null ? ", " + order.getShippingAddressLine2() : "") + "\n" +
                      "  City/State/Zip: " + order.getShippingCity() + ", " + order.getShippingState() + ", " + order.getShippingCountry() + " - " + order.getShippingPincode() + "\n\n" +
                      "If you wish to cancel this order, you can do so from your Placed Orders page within 5 minutes of purchase.\n\n" +
                      "Best regards,\nE-Commerce Team";

        sendEmail(toEmail, "Order Confirmation - Order #" + order.getId(), body);
    }

    public void sendCancellationRequestEmail(String toEmail, Order order, String otp) {
        System.out.println("=================================================");
        System.out.println("CANCELLATION OTP FOR ORDER #" + order.getId() + " TO " + toEmail + ": " + otp);
        System.out.println("=================================================");

        String body = "We received a request to cancel your order #" + order.getId() + ".\n\n" +
                      "Please enter the following OTP code to confirm the cancellation:\n\n" +
                      "Cancellation OTP: " + otp + "\n\n" +
                      "This code is valid for 5 minutes. If you did not request this cancellation, please ignore this email.\n\n" +
                      "Best regards,\nE-Commerce Team";

        sendEmail(toEmail, "Order Cancellation Request - Order #" + order.getId(), body);
    }

    public void sendOrderCancelledEmail(String toEmail, Order order) {
        String body = "Your order #" + order.getId() + " has been successfully cancelled. The items have been returned to stock, and any processed payment will be refunded shortly.\n\n" +
                      "Best regards,\nE-Commerce Team";

        sendEmail(toEmail, "Order Cancelled - Order #" + order.getId(), body);
    }

    public void sendOrderDeliveredEmail(String toEmail, Order order) {
        String body = "Great news! Your order #" + order.getId() + " has been marked as delivered.\n\n" +
                      "Thank you for shopping with us! We hope to see you again soon.\n\n" +
                      "Best regards,\nE-Commerce Team";

        sendEmail(toEmail, "Order Delivered - Order #" + order.getId(), body);
    }

    private void sendEmail(String toEmail, String subject, String body) {
        System.out.println("=================================================");
        System.out.println("EMAIL SENT TO: " + toEmail);
        System.out.println("SUBJECT: " + subject);
        System.out.println("BODY:\n" + body);
        System.out.println("=================================================");
        
        if (!mailEnabled || mailSender == null) {
            System.out.println("[Info] Email sending is disabled (local mode). Email logged to console above.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            System.out.println("Email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("[Error] Failed to send email to " + toEmail + ": " + e.getMessage());
        }
    }
}
