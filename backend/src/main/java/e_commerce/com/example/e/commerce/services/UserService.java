package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Role;
import e_commerce.com.example.e.commerce.models.User;
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
