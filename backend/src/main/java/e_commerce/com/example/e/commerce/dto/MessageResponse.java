package e_commerce.com.example.e.commerce.dto;

public class MessageResponse {
    private String message;

    public MessageResponse() {}

    public MessageResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
