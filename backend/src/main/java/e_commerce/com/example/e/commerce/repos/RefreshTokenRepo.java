package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.RefreshToken;
import e_commerce.com.example.e.commerce.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepo extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
}
