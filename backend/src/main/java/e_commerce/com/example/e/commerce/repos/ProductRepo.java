package e_commerce.com.example.e.commerce.repos;
import e_commerce.com.example.e.commerce.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface ProductRepo extends JpaRepository<Product, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    List<Product> findBySellerId(Long sellerId);
    List<Product> findBySellerEmail(String email);

    @Query(value = "SELECT * FROM product ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Product> findRandomProducts(@Param("limit") int limit);

    List<Product> findTop20ByOrderByIdDesc();
    List<Product> findTop20ByOrderByRatingDesc();
    List<Product> findTop20ByOrderByReviewCountDesc();

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL AND p.category != ''")
    List<String> findDistinctCategories();

    @Query(value = 
        "SELECT *, ts_rank(" +
        "  setweight(to_tsvector('english', coalesce(name, '')), 'A') || " +
        "  setweight(to_tsvector('english', coalesce(brand, '')), 'A') || " +
        "  setweight(to_tsvector('english', coalesce(category, '')), 'B') || " +
        "  setweight(to_tsvector('english', coalesce(description, '')), 'C'), " +
        "  to_tsquery('english', :formattedQuery)" +
        ") as rank, " +
        "similarity(name, :rawQuery) as sim_rank " +
        "FROM product " +
        "WHERE ( " +
        "  setweight(to_tsvector('english', coalesce(name, '')), 'A') || " +
        "  setweight(to_tsvector('english', coalesce(brand, '')), 'A') || " +
        "  setweight(to_tsvector('english', coalesce(category, '')), 'B') || " +
        "  setweight(to_tsvector('english', coalesce(description, '')), 'C') " +
        ") @@ to_tsquery('english', :formattedQuery) " +
        "OR name % :rawQuery " +
        "ORDER BY rank DESC, sim_rank DESC", 
        nativeQuery = true)
    List<Product> searchProductsFTS(@Param("formattedQuery") String formattedQuery, @Param("rawQuery") String rawQuery);
}

