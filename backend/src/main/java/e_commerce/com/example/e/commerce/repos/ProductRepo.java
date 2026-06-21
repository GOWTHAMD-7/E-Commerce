package e_commerce.com.example.e.commerce.repos;
import e_commerce.com.example.e.commerce.models.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductRepo extends JpaRepository<Product, Long> {
    List<Product> findBySellerId(Long sellerId);
    List<Product> findBySellerEmail(String email);

    @Query(value = "SELECT * FROM product ORDER BY RANDOM() LIMIT :limit", nativeQuery = true)
    List<Product> findRandomProducts(@Param("limit") int limit);

    List<Product> findTop20ByOrderByIdDesc();
    List<Product> findTop20ByOrderByRatingDesc();
    List<Product> findTop20ByOrderByReviewCountDesc();

    @Query(value = 
        "SELECT *, ts_rank(" +
        "  setweight(to_tsvector('english', coalesce(name, '')), 'A') || " +
        "  setweight(to_tsvector('english', coalesce(brand, '')), 'A') || " +
        "  setweight(to_tsvector('english', coalesce(category, '')), 'B') || " +
        "  setweight(to_tsvector('english', coalesce(description, '')), 'C'), " +
        "  to_tsquery('english', :formattedQuery)" +
        ") as rank " +
        "FROM product " +
        "WHERE ( " +
        "  setweight(to_tsvector('english', coalesce(name, '')), 'A') || " +
        "  setweight(to_tsvector('english', coalesce(brand, '')), 'A') || " +
        "  setweight(to_tsvector('english', coalesce(category, '')), 'B') || " +
        "  setweight(to_tsvector('english', coalesce(description, '')), 'C') " +
        ") @@ to_tsquery('english', :formattedQuery) " +
        "ORDER BY rank DESC", 
        nativeQuery = true)
    List<Product> searchProductsFTS(@Param("formattedQuery") String formattedQuery);
}

