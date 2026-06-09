package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.dto.LoginRequest;
import e_commerce.com.example.e.commerce.dto.RegisterRequest;
import e_commerce.com.example.e.commerce.dto.AuthResponse;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.services.UserService;
import e_commerce.com.example.e.commerce.services.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    /**
     * Register new user
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        try {
            // Register user in database
            User user = userService.registerUser(
                request.getName(),
                request.getEmail(),
                request.getPassword()
            );

            // Generate JWT token
            String token = jwtService.generateToken(user.getEmail());

            // Return token and success message
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new AuthResponse(token, "User registered successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new AuthResponse(null, e.getMessage()));
        }
    }

    /**
     * Login user
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            // Find user by email
            User user = userService.findByEmail(request.getEmail());

            // Validate password
            if (!userService.validatePassword(request.getPassword(), user.getPassword())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new AuthResponse(null, "Invalid password"));
            }

            // Generate JWT token
            String token = jwtService.generateToken(user.getEmail());

            // Return token and success message
            return ResponseEntity.ok(new AuthResponse(token, "Login successful"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, "User not found"));
        }
    }
}

