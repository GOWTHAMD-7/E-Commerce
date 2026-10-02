package e_commerce.com.example.e.commerce.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.http.HttpMethod;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

	private final JwtFilter jwtFilter;

	public SecurityConfig(JwtFilter jwtFilter) {
		this.jwtFilter = jwtFilter;
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				.cors(cors -> {})
				.csrf(csrf -> csrf.disable())
				.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/auth/**", "/api/auth/**", "/home", "/v3/api-docs", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/upload", "/api/upload").permitAll()
						.requestMatchers("/actuator/health", "/actuator/metrics/**", "/actuator/prometheus").permitAll()
						.requestMatchers(HttpMethod.POST, "/admin/products/backfill-embeddings", "/api/admin/products/backfill-embeddings").permitAll()
						.requestMatchers(HttpMethod.GET, "/products", "/products/**", "/api/products/**", "/api/reviews/products/**", "/reviews/products/**", "/api/recommendations", "/recommendations").permitAll()
						.requestMatchers(HttpMethod.POST, "/products", "/products/**", "/api/products", "/api/products/**").hasAnyRole("SELLER", "ADMIN")
						.requestMatchers(HttpMethod.PUT, "/products", "/products/**", "/api/products", "/api/products/**").hasAnyRole("SELLER", "ADMIN")
						.requestMatchers(HttpMethod.DELETE, "/products", "/products/**", "/api/products", "/api/products/**").hasAnyRole("SELLER", "ADMIN")
						.requestMatchers("/api/cart/**", "/cart/**", "/api/orders/**", "/orders/**", "/api/favorites/**", "/favorites/**", "/api/reviews/**", "/reviews/**", "/api/address/**", "/address/**").hasAnyRole("CUSTOMER", "SELLER")
						.requestMatchers("/seller/**", "/api/seller/**").hasRole("SELLER")
						.requestMatchers("/admin/**", "/api/admin/**").hasRole("ADMIN")
						.anyRequest().authenticated()
				)
				.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
