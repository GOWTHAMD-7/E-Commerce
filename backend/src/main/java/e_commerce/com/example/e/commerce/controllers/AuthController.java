package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.dto.AuthResponse;
import e_commerce.com.example.e.commerce.dto.LoginRequest;
import e_commerce.com.example.e.commerce.dto.RegisterRequest;
import e_commerce.com.example.e.commerce.dto.MessageResponse;
import e_commerce.com.example.e.commerce.models.Role;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.models.RefreshToken;
import e_commerce.com.example.e.commerce.services.JwtService;
import e_commerce.com.example.e.commerce.services.RefreshTokenService;
import e_commerce.com.example.e.commerce.services.UserService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;

@RestController
@RequestMapping({"/auth", "/api/auth"})
public class AuthController {

	private final UserService userService;
	private final JwtService jwtService;
	private final RefreshTokenService refreshTokenService;

	public AuthController(UserService userService, JwtService jwtService, RefreshTokenService refreshTokenService) {
		this.userService = userService;
		this.jwtService = jwtService;
		this.refreshTokenService = refreshTokenService;
	}

	private void attachJwtCookie(HttpServletResponse response, String token) {
		if (token == null) return;
		ResponseCookie cookie = ResponseCookie.from("jwt_token", token)
				.httpOnly(true)
				.secure(true) // Required for HTTPS environments (Render/Vercel)
				.path("/")
				.sameSite("None") // Required for cross-domain cookie sharing
				.maxAge(jwtService.getExpirationSeconds()) // Matches JWT expiry exactly
				.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
	}

	private void attachRefreshTokenCookie(HttpServletResponse response, String token) {
		if (token == null) return;
		ResponseCookie cookie = ResponseCookie.from("refresh_token", token)
				.httpOnly(true)
				.secure(true)
				.path("/api/auth/refresh-token") // Only sent to refresh endpoint
				.sameSite("None")
				.maxAge(604800) // 7 days
				.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
	}

	private void clearJwtCookie(HttpServletResponse response) {
		ResponseCookie cookie = ResponseCookie.from("jwt_token", "")
				.httpOnly(true)
				.secure(true)
				.path("/")
				.sameSite("None")
				.maxAge(0)
				.build();
		response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
		
		ResponseCookie refreshCookie = ResponseCookie.from("refresh_token", "")
				.httpOnly(true)
				.secure(true)
				.path("/api/auth/refresh-token")
				.sameSite("None")
				.maxAge(0)
				.build();
		response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
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
			userService.registerUser(request.getName(), request.getEmail(), request.getPassword(), roleEnum);
			return ResponseEntity.ok(new AuthResponse(null, "Verification code sent to email. Please verify."));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, e.getMessage()));
		}
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
		try {
			User user = userService.findByEmail(request.getEmail());
			if (!userService.validatePassword(request.getPassword(), user.getPassword())) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(null, "Invalid credentials"));
			}
			if (!user.isEnabled()) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(null, "Please verify your email first using the OTP code sent to your email."));
			}
			String token = jwtService.generateToken(user);
			attachJwtCookie(response, token);
			
			RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
			attachRefreshTokenCookie(response, refreshToken.getToken());
			
			return ResponseEntity.ok(new AuthResponse(token, "Login successful"));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(null, e.getMessage()));
		}
	}

	@PostMapping("/verify-otp")
	public ResponseEntity<AuthResponse> verifyOtp(@RequestBody Map<String, String> request, HttpServletResponse response) {
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
				attachJwtCookie(response, token);
				
				RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
				attachRefreshTokenCookie(response, refreshToken.getToken());
				
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

	@PostMapping("/forgot-password")
	public ResponseEntity<MessageResponse> forgotPassword(@RequestBody Map<String, String> request) {
		String email = request.get("email");
		if (email == null) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse("Email is required"));
		}
		try {
			userService.requestPasswordReset(email);
			return ResponseEntity.ok(new MessageResponse("Password reset OTP code sent to your email."));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new MessageResponse(e.getMessage()));
		}
	}

	@PostMapping("/reset-password")
	public ResponseEntity<AuthResponse> resetPassword(@RequestBody Map<String, String> request, HttpServletResponse response) {
		String email = request.get("email");
		String otp = request.get("otp");
		String newPassword = request.get("newPassword");

		if (email == null || otp == null || newPassword == null) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, "Email, OTP, and newPassword are required"));
		}

		try {
			userService.resetPassword(email, otp, newPassword);
			User user = userService.findByEmail(email);
			String token = jwtService.generateToken(user);
			attachJwtCookie(response, token);
			
			RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
			attachRefreshTokenCookie(response, refreshToken.getToken());
			
			return ResponseEntity.ok(new AuthResponse(token, "Password reset successful"));
		} catch (RuntimeException e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, e.getMessage()));
		}
	}

	@PostMapping("/google")
	public ResponseEntity<AuthResponse> googleLogin(@RequestBody Map<String, String> request, HttpServletResponse response) {
		String idToken = request.get("idToken");
		if (idToken == null || idToken.trim().isEmpty()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, "Google ID token is required"));
		}
		try {
			User user = userService.loginOrRegisterGoogle(idToken);
			String token = jwtService.generateToken(user);
			attachJwtCookie(response, token);
			
			RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
			attachRefreshTokenCookie(response, refreshToken.getToken());
			
			return ResponseEntity.ok(new AuthResponse(token, "Login successful"));
		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new AuthResponse(null, e.getMessage()));
		}
	}

	@PostMapping("/logout")
	public ResponseEntity<MessageResponse> logout(HttpServletResponse response) {
		clearJwtCookie(response);
		return ResponseEntity.ok(new MessageResponse("Logout successful"));
	}
	
	@PostMapping("/refresh-token")
	public ResponseEntity<AuthResponse> refreshToken(@CookieValue(name = "refresh_token", required = false) String requestRefreshToken, HttpServletResponse response) {
		if (requestRefreshToken == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new AuthResponse(null, "Refresh token is missing!"));
		}
		
		return refreshTokenService.findByToken(requestRefreshToken)
			.map(refreshTokenService::verifyExpiration)
			.map(RefreshToken::getUser)
			.map(user -> {
				String token = jwtService.generateToken(user);
				attachJwtCookie(response, token);
				return ResponseEntity.ok(new AuthResponse(token, "Token refreshed successfully"));
			})
			.orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
	}
}
