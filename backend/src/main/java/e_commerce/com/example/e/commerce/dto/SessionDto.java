package e_commerce.com.example.e.commerce.dto;

import java.time.Instant;

public class SessionDto {
    private Long id;
    private String deviceInfo;
    private Instant lastActive;
    private boolean isCurrentSession;

    public SessionDto(Long id, String deviceInfo, Instant lastActive, boolean isCurrentSession) {
        this.id = id;
        this.deviceInfo = deviceInfo;
        this.lastActive = lastActive;
        this.isCurrentSession = isCurrentSession;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }

    public Instant getLastActive() { return lastActive; }
    public void setLastActive(Instant lastActive) { this.lastActive = lastActive; }

    public boolean isCurrentSession() { return isCurrentSession; }
    public void setCurrentSession(boolean currentSession) { isCurrentSession = currentSession; }
}
