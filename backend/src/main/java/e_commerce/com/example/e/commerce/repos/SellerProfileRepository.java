package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.SellerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SellerProfileRepository extends JpaRepository<SellerProfile, Long> {
    Optional<SellerProfile> findByUserId(Long userId);
    Optional<SellerProfile> findByUserEmail(String email);
}
