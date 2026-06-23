package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Role;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.models.AuthProvider;
import e_commerce.com.example.e.commerce.models.VerificationToken;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import e_commerce.com.example.e.commerce.repos.VerificationTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.LocalDateTime;
import java.util.Random;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final VerificationTokenRepository verificationTokenRepository;
    private final EmailService emailService;

    @Autowired
    public UserService(UserRepository userRepository, 
                       PasswordEncoder passwordEncoder,
                       VerificationTokenRepository verificationTokenRepository,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.verificationTokenRepository = verificationTokenRepository;
        this.emailService = emailService;
    }

    @Transactional
    public User registerUser(String name, String email, String password, Role role) {
        // Check if user already exists
        java.util.Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;
        
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.isEnabled()) {
                throw new RuntimeException("User with this email already exists");
            }
            // If the user exists but is NOT enabled, update their registration details
            user.setName(name);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role != null ? role : Role.CUSTOMER);
        } else {
            // Create new user (enabled = false until verified)
            user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setRole(role != null ? role : Role.CUSTOMER);
            user.setEnabled(false);
        }

        User savedUser = userRepository.save(user);
        
        // Generate and send OTP code
        generateAndSendOtp(email);
        
        return savedUser;
    }

    @Transactional
    public void generateAndSendOtp(String email) {
        // Double check if user exists
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        
        // Generate a 6-digit code
        Random random = new Random();
        String otp = String.format("%06d", random.nextInt(1000000));

        // Save or update verification token (valid for 5 minutes)
        VerificationToken token = verificationTokenRepository.findByEmail(email)
                .orElse(new VerificationToken());
        token.setToken(otp);
        token.setEmail(email);
        token.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        verificationTokenRepository.save(token);

        // Send OTP email
        emailService.sendOtpEmail(email, otp);
    }

    @Transactional
    public boolean verifyOtp(String email, String otp) {
        java.util.Optional<VerificationToken> tokenOpt = verificationTokenRepository.findByEmailAndToken(email, otp);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        VerificationToken token = tokenOpt.get();
        // Check expiration
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            verificationTokenRepository.delete(token);
            return false;
        }

        // Enable user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setEnabled(true);
        userRepository.save(user);

        // Clean up token
        verificationTokenRepository.delete(token);
        return true;
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public boolean validatePassword(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        if (!user.isEnabled()) {
            throw new RuntimeException("Please verify your email first using the OTP code sent to your email.");
        }

        // Generate a 6-digit code
        Random random = new Random();
        String otp = String.format("%06d", random.nextInt(1000000));

        // Save or update verification token (valid for 5 minutes)
        VerificationToken token = verificationTokenRepository.findByEmail(email)
                .orElse(new VerificationToken());
        token.setToken(otp);
        token.setEmail(email);
        token.setExpiryDate(LocalDateTime.now().plusMinutes(5));
        verificationTokenRepository.save(token);

        // Send reset email
        emailService.sendPasswordResetOtpEmail(email, otp);
    }

    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        VerificationToken token = verificationTokenRepository.findByEmailAndToken(email, otp)
                .orElseThrow(() -> new RuntimeException("Invalid or expired verification code"));

        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            verificationTokenRepository.delete(token);
            throw new RuntimeException("Verification code has expired");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Clean up token
        verificationTokenRepository.delete(token);
    }

    @Transactional
    public User loginOrRegisterGoogle(String accessToken) {
        try {
            String userInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.setBearerAuth(accessToken);
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            org.springframework.http.ResponseEntity<java.util.Map> response = restTemplate.exchange(
                userInfoUrl, 
                org.springframework.http.HttpMethod.GET, 
                entity, 
                java.util.Map.class
            );

            if (response.getStatusCode() != org.springframework.http.HttpStatus.OK || response.getBody() == null) {
                throw new RuntimeException("Invalid Google Access Token");
            }

            java.util.Map<String, Object> payload = response.getBody();
            String googleId = (String) payload.get("sub");
            String email = (String) payload.get("email");
            String name = (String) payload.get("name");

            // Look up user by Google ID
            java.util.Optional<User> userByGoogleId = userRepository.findByGoogleId(googleId);
            if (userByGoogleId.isPresent()) {
                User user = userByGoogleId.get();
                if (!user.isEnabled()) {
                    user.setEnabled(true);
                    userRepository.save(user);
                }
                return user;
            }

            // Look up user by email
            java.util.Optional<User> userByEmail = userRepository.findByEmail(email);
            if (userByEmail.isPresent()) {
                User user = userByEmail.get();
                user.setGoogleId(googleId);
                user.setAuthProvider(AuthProvider.GOOGLE);
                user.setEnabled(true);
                return userRepository.save(user);
            }

            // Register new Google user
            User user = new User();
            user.setName(name != null ? name : "Google User");
            user.setEmail(email);
            user.setGoogleId(googleId);
            user.setAuthProvider(AuthProvider.GOOGLE);
            user.setEnabled(true);
            user.setPassword(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            user.setRole(Role.CUSTOMER);

            return userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Failed to verify Google Token: " + e.getMessage());
        }
    }

    @Scheduled(fixedDelay = 60000) // runs every 60 seconds
    @Transactional
    public void cleanUpUnverifiedUsers() {
        java.util.List<User> unverifiedUsers = userRepository.findByEnabled(false);
        for (User user : unverifiedUsers) {
            java.util.Optional<VerificationToken> tokenOpt = verificationTokenRepository.findByEmail(user.getEmail());
            if (tokenOpt.isEmpty()) {
                userRepository.delete(user);
                System.out.println("Cleanup Scheduler: Deleted unverified user with no token: " + user.getEmail());
            } else if (tokenOpt.get().getExpiryDate().isBefore(LocalDateTime.now())) {
                verificationTokenRepository.delete(tokenOpt.get());
                userRepository.delete(user);
                System.out.println("Cleanup Scheduler: Deleted unverified user with expired token: " + user.getEmail());
            }
        }
    }
}
