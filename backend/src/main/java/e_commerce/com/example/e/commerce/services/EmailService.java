package e_commerce.com.example.e.commerce.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import e_commerce.com.example.e.commerce.models.Order;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name:E-Commerce Team}")
    private String senderName;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    @PostConstruct
    public void init() {
        System.out.println("=================================================");
        System.out.println("EmailService Initialized (Brevo HTTP API):");
        System.out.println("  Sender Email: " + senderEmail);
        System.out.println("  API Key configured: " + (brevoApiKey != null && !brevoApiKey.isEmpty()));
        System.out.println("=================================================");
    }

    public void sendOtpEmail(String toEmail, String otp) {
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
        for (e_commerce.com.example.e.commerce.models.OrderItem item : order.getOrderItems()) {
            itemsSummary.append("- ").append(item.getProduct().getName())
                        .append(" x").append(item.getQuantity())
                        .append(" ($").append(String.format("%.2f", item.getPurchasedPrice())).append(" each)")
                        .append(" - $").append(String.format("%.2f", item.getPurchasedPrice() * item.getQuantity()))
                        .append("\n");
            total += item.getPurchasedPrice() * item.getQuantity();
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
                      "  Address: " + order.getShippingAddressLine1() + ", " + (order.getShippingAddressLine2() != null ? order.getShippingAddressLine2() : "") + "\n" +
                      "  City/State/Zip: " + order.getShippingCity() + ", " + order.getShippingState() + " - " + order.getShippingPincode() + "\n\n" +
                      "If you wish to cancel this order, you can do so from your Placed Orders page within 5 minutes of purchase.\n\n" +
                      "Best regards,\nE-Commerce Team";

        sendEmail(toEmail, "Order Confirmation - Order #" + order.getId(), body);
    }

    public void sendCancellationRequestEmail(String toEmail, Order order, String otp) {
        String body = "We received a request to cancel your order #" + order.getId() + ".\n\n" +
                      "Please enter the following OTP code to confirm your cancellation:\n\n" +
                      "Cancellation OTP: " + otp + "\n\n" +
                      "This code is valid for 5 minutes. If you did not request this cancellation, please ignore this email and your order will proceed as normal.\n\n" +
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

    public void sendPasswordResetOtpEmail(String toEmail, String otp) {
        String body = "We received a request to reset your password.\n\n" +
                      "Please enter the following OTP code to proceed with resetting your password:\n\n" +
                      "Password Reset OTP: " + otp + "\n\n" +
                      "This code is valid for 5 minutes. If you did not request this, please ignore this email and your password will remain unchanged.\n\n" +
                      "Best regards,\nE-Commerce Team";

        sendEmail(toEmail, "Reset your password - E-Commerce OTP Verification", body);
    }

    private void sendEmail(String toEmail, String subject, String body) {
        System.out.println("=================================================");
        System.out.println("PREPARING TO SEND EMAIL VIA BREVO API TO: " + toEmail);
        
        try {
            // 1. Set headers with Brevo API key
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("api-key", brevoApiKey);

            // 2. Build the JSON body payload
            Map<String, Object> sender = new HashMap<>();
            sender.put("name", senderName);
            sender.put("email", senderEmail);

            Map<String, Object> to = new HashMap<>();
            to.put("email", toEmail);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("sender", sender);
            requestBody.put("to", List.of(to));
            requestBody.put("subject", subject);
            requestBody.put("textContent", body);

            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

            // 3. Make the HTTP POST Request
            ResponseEntity<String> response = restTemplate.exchange(
                    BREVO_API_URL,
                    HttpMethod.POST,
                    requestEntity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                System.out.println("Email sent successfully via HTTP to: " + toEmail);
            } else {
                System.err.println("[Error] Brevo API responded with status: " + response.getStatusCode());
                System.err.println("Response body: " + response.getBody());
                throw new RuntimeException("Failed to send email. Status: " + response.getStatusCode());
            }

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            String responseBody = e.getResponseBodyAsString();
            System.err.println("[Error] Brevo API HTTP Error: " + e.getStatusCode());
            System.err.println("Response body: " + responseBody);
            
            if (responseBody.contains("quota") || e.getStatusCode().value() == 402 || e.getStatusCode().value() == 403 || e.getStatusCode().value() == 429) {
                throw new RuntimeException("Sorry! Today's mail limit is over. Please try again tomorrow.");
            } else {
                throw new RuntimeException("Failed to send email. Please check your email configuration.");
            }
        } catch (Exception e) {
            System.err.println("[Error] Failed to send email via Brevo HTTP API to " + toEmail + ": " + e.getMessage());
            throw new RuntimeException("Failed to send email due to an unexpected error.");
        }
        System.out.println("=================================================");
    }
}
