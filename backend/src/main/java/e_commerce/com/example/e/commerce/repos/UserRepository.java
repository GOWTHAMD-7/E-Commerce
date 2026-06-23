package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import e_commerce.com.example.e.commerce.models.Role;
import java.util.Optional;
import java.util.List;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByGoogleId(String googleId);
    List<User> findByRole(Role role);
    List<User> findByEnabled(boolean enabled);
}

