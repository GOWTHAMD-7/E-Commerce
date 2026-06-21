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
						.requestMatchers("/auth/**", "/home", "/v3/api-docs", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/upload").permitAll()
						.requestMatchers(HttpMethod.GET, "/products", "/products/**", "/api/reviews/products/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/products", "/products/**").hasAnyRole("SELLER", "ADMIN")
						.requestMatchers(HttpMethod.PUT, "/products", "/products/**").hasAnyRole("SELLER", "ADMIN")
						.requestMatchers(HttpMethod.DELETE, "/products", "/products/**").hasAnyRole("SELLER", "ADMIN")
						.requestMatchers("/api/cart/**", "/api/orders/**", "/api/favorites/**", "/api/reviews/**", "/api/address/**").hasAnyRole("CUSTOMER", "SELLER")
						.requestMatchers("/seller/**").hasRole("SELLER")
						.requestMatchers("/admin/**").hasRole("ADMIN")
						.anyRequest().authenticated()
				)
				.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
