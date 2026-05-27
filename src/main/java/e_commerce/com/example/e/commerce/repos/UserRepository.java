package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}

