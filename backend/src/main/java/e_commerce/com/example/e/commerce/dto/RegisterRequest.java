package e_commerce.com.example.e.commerce.dto;

import lombok.Data;

@Data
public class RegisterRequest {
	private String name;
	private String email;
	private String password;
	private String role;
}
