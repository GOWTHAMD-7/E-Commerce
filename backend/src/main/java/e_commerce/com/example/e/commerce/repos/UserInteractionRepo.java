package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.models.UserInteraction;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface UserInteractionRepo extends JpaRepository<UserInteraction, Long> {
    
    long countByUser(User user);
    
    List<UserInteraction> findByUserOrderByCreatedAtDesc(User user);
    
    @Query("SELECT u FROM UserInteraction u WHERE u.user = :user ORDER BY u.weight ASC, u.createdAt ASC, u.id ASC")
    List<UserInteraction> findByUserOrderedForPruning(@Param("user") User user, Pageable pageable);

    /** Returns all unsynced interactions, eagerly fetching user and product for batch processing */
    @Query("SELECT u FROM UserInteraction u JOIN FETCH u.user LEFT JOIN FETCH u.product WHERE u.preferenceSynced = false ORDER BY u.user.id ASC, u.createdAt ASC")
    List<UserInteraction> findAllUnsyncedWithDetails();

    /** Mark a batch of interactions as synced */
    @Modifying
    @Query("UPDATE UserInteraction u SET u.preferenceSynced = true WHERE u.id IN :ids")
    void markAsSynced(@Param("ids") List<Long> ids);
}
