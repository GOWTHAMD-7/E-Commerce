package e_commerce.com.example.e.commerce.dto;

public class RoleUpdateRequest {
    private String role;

    public RoleUpdateRequest() {}

    public RoleUpdateRequest(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
