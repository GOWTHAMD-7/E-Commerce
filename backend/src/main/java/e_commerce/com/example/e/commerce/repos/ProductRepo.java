package e_commerce.com.example.e.commerce.repos;
import e_commerce.com.example.e.commerce.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProductRepo extends JpaRepository<Product, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    List<Product> findBySellerId(Long sellerId);
    List<Product> findBySellerEmail(String email);

    Page<Product> findByCategoryIgnoreCase(String category, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE (" +
           "LOWER(p.category) = LOWER(:category) OR " +
           "LOWER(p.category) LIKE LOWER(CONCAT('%', :category, '%')) OR " +
           "(p.subCategory IS NOT NULL AND LOWER(p.subCategory) LIKE LOWER(CONCAT('%', :category, '%')))) " +
           "ORDER BY p.viewCount DESC, p.rating DESC")
    Page<Product> findByCategoryFlexible(@Param("category") String category, Pageable pageable);

    @Query(value = "SELECT * FROM product ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Product> findRandomProducts(@Param("limit") int limit);

    List<Product> findTop15ByOrderByIdDesc();
    List<Product> findTop15ByOrderByRatingDesc();
    List<Product> findTop15ByOrderByReviewCountDesc();
    List<Product> findTop15ByOrderByViewCountDesc();
    List<Product> findTop20ByOrderByIdDesc();
    List<Product> findTop20ByOrderByRatingDesc();
    List<Product> findTop20ByOrderByReviewCountDesc();
    List<Product> findTop20ByOrderByViewCountDesc();
    Page<Product> findAllByOrderByViewCountDesc(Pageable pageable);

    @Query("SELECT DISTINCT p.category FROM Product p WHERE p.category IS NOT NULL")
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

