package e_commerce.com.example.e.commerce.services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService{

	private String secretKey ="Q9vK2mL8xT4pR7sN1wZ6yF3aJ8uD5gH2eB9cX4rP7qL1nM6tV2kS8uY5iC3oW9zA";

	@Value("${jwt.expiration:3600000}")
	private long jwtExpiration;

	public String generateToken(String email) {
		return buildToken(email, jwtExpiration);
	}

	private String buildToken(String email, long expiration) {
		Date issuedAt = new Date(System.currentTimeMillis());
		Date expirationDate = new Date(System.currentTimeMillis() + expiration);

		return Jwts.builder()
				.subject(email)
				.issuedAt(issuedAt)
				.expiration(expirationDate)
				.signWith(getSigningKey())
				.compact();
	}

	public String extractEmail(String token) {
		return extractClaim(token, Claims::getSubject);
	}

	public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
		final Claims claims = extractAllClaims(token);
		return claimsResolver.apply(claims);
	}

	private Claims extractAllClaims(String token) {
		return Jwts.parser()
				.verifyWith(getSigningKey())
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public boolean isTokenValid(String token) {
		try {
			extractAllClaims(token);
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	private SecretKey getSigningKey() {
		byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
		return Keys.hmacShaKeyFor(keyBytes);
	}
}
