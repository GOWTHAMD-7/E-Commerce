package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.dto.AuthResponse;
import e_commerce.com.example.e.commerce.dto.LoginRequest;
import e_commerce.com.example.e.commerce.dto.RegisterRequest;
import e_commerce.com.example.e.commerce.dto.MessageResponse;
import e_commerce.com.example.e.commerce.models.Role;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.services.JwtService;
import e_commerce.com.example.e.commerce.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/auth")
public class AuthController {

	private final UserService userService;
	private final JwtService jwtService;

	public AuthController(UserService userService, JwtService jwtService) {
		this.userService = userService;
		this.jwtService = jwtService;
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
		try {
			Role roleEnum = Role.CUSTOMER;
			if (request.getRole() != null && !request.getRole().trim().isEmpty()) {
				try {
					roleEnum = Role.valueOf(request.getRole().trim().toUpperCase());
				} catch (IllegalArgumentException e) {
					return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, "Invalid role. Must be CUSTOMER, SELLER, or ADMIN"));
				}
			}
			// Creates user with enabled = false, generates OTP and logs to console / sends email
			userService.registerUser(request.getName(), request.getEmail(), request.getPassword(), roleEnum);
			return ResponseEntity.ok(new AuthResponse(null, "Verification code sent to email. Please verify."));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, e.getMessage()));
		}
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
		try {
			User user = userService.findByEmail(request.getEmail());
			if (!userService.validatePassword(request.getPassword(), user.getPassword())) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(null, "Invalid credentials"));
			}
			if (!user.isEnabled()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(null, "Please verify your email first using the OTP code sent to your email."));
			}
			String token = jwtService.generateToken(user);
			return ResponseEntity.ok(new AuthResponse(token, "Login successful"));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(null, e.getMessage()));
		}
	}

	@PostMapping("/verify-otp")
	public ResponseEntity<AuthResponse> verifyOtp(@RequestBody Map<String, String> request) {
		String email = request.get("email");
		String otp = request.get("otp");

		if (email == null || otp == null) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, "Email and OTP are required"));
		}

		try {
			boolean isVerified = userService.verifyOtp(email, otp);
			if (isVerified) {
				User user = userService.findByEmail(email);
				String token = jwtService.generateToken(user);
				return ResponseEntity.ok(new AuthResponse(token, "Account verified successfully"));
			} else {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, "Invalid or expired verification code"));
			}
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, e.getMessage()));
		}
	}

	@PostMapping("/resend-otp")
	public ResponseEntity<MessageResponse> resendOtp(@RequestBody Map<String, String> request) {
		String email = request.get("email");
		if (email == null) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse("Email is required"));
		}
		try {
			userService.generateAndSendOtp(email);
			return ResponseEntity.ok(new MessageResponse("Verification code resent successfully"));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));
		}
	}
}
