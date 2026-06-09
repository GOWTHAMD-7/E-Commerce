package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.dto.AuthResponse;
import e_commerce.com.example.e.commerce.dto.LoginRequest;
import e_commerce.com.example.e.commerce.dto.RegisterRequest;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.services.JwtService;
import e_commerce.com.example.e.commerce.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
			User user = userService.registerUser(request.getName(), request.getEmail(), request.getPassword());
			String token = jwtService.generateToken(user.getEmail());
			return ResponseEntity.ok(new AuthResponse(token, "User registered successfully"));
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
			String token = jwtService.generateToken(user.getEmail());
			return ResponseEntity.ok(new AuthResponse(token, "Login successful"));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(null, e.getMessage()));
		}
	}
}

