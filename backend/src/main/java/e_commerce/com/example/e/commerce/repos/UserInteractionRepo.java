package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.models.UserInteraction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserInteractionRepo extends JpaRepository<UserInteraction, Long> {
    
    long countByUser(User user);
    
    List<UserInteraction> findByUserOrderByCreatedAtDesc(User user);
    
    @Query("SELECT u FROM UserInteraction u WHERE u.user = :user ORDER BY u.weight ASC, u.createdAt ASC, u.id ASC")
    List<UserInteraction> findByUserOrderedForPruning(@Param("user") User user, Pageable pageable);
}
