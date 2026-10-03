package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.RefreshToken;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.RefreshTokenRepo;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;
import e_commerce.com.example.e.commerce.dto.SessionDto;
import e_commerce.com.example.e.commerce.exceptions.DeviceLimitExceededException;

@Service
public class RefreshTokenService {
    @Autowired
    private RefreshTokenRepo refreshTokenRepo;

    @Autowired
    private UserRepository userRepository;

    // 7 days in milliseconds (7 * 24 * 60 * 60 * 1000)
    private final long refreshTokenDurationMs = 604800000L;

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepo.findByToken(token);
    }

    @Transactional
    public RefreshToken createRefreshToken(Long userId, String deviceInfo, String ipAddress) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        
        List<RefreshToken> existingTokens = refreshTokenRepo.findByUser(user);
        
        if (existingTokens.size() >= 2) {
            List<SessionDto> sessions = existingTokens.stream()
                .map(t -> new SessionDto(t.getId(), t.getDeviceInfo(), t.getLastActive(), false))
                .collect(Collectors.toList());
            throw new DeviceLimitExceededException("Device limit reached. Please log out of an existing device.", sessions);
        }

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setToken(UUID.randomUUID().toString());
        refreshToken.setDeviceInfo(deviceInfo);
        refreshToken.setIpAddress(ipAddress);
        refreshToken.setLastActive(Instant.now());
        
        return refreshTokenRepo.save(refreshToken);
    }

    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepo.delete(token);
            throw new RuntimeException("Refresh token was expired. Please make a new signin request");
        }
        // Update last active on every successful refresh
        token.setLastActive(Instant.now());
        return refreshTokenRepo.save(token);
    }

    @Transactional
    public void deleteByUserId(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        refreshTokenRepo.deleteByUser(user);
    }

    @Transactional
    public void deleteByIdAndUserId(Long id, Long userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        refreshTokenRepo.deleteByIdAndUser(id, user);
    }
    
    public List<SessionDto> getActiveSessions(Long userId, String currentToken) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        return refreshTokenRepo.findByUser(user).stream()
            .map(t -> new SessionDto(
                t.getId(), 
                t.getDeviceInfo(), 
                t.getLastActive(), 
                t.getToken().equals(currentToken)
            ))
            .collect(Collectors.toList());
    }
}
