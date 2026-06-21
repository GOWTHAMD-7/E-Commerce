package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.VerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByEmail(String email);
    Optional<VerificationToken> findByEmailAndToken(String email, String token);
    void deleteByEmail(String email);
}
