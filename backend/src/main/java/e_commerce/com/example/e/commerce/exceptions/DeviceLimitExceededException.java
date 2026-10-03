package e_commerce.com.example.e.commerce.exceptions;

import e_commerce.com.example.e.commerce.dto.SessionDto;
import java.util.List;

public class DeviceLimitExceededException extends RuntimeException {
    private final List<SessionDto> activeSessions;

    public DeviceLimitExceededException(String message, List<SessionDto> activeSessions) {
        super(message);
        this.activeSessions = activeSessions;
    }

    public List<SessionDto> getActiveSessions() {
        return activeSessions;
    }
}
