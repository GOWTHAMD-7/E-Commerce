package e_commerce.com.example.e.commerce.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseIndexInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Create a weighted GIN index to speed up FTS queries
            jdbcTemplate.execute(
                "CREATE INDEX IF NOT EXISTS product_search_idx ON product USING gin(" +
                "setweight(to_tsvector('english', coalesce(name, '')), 'A') || " +
                "setweight(to_tsvector('english', coalesce(brand, '')), 'A') || " +
                "setweight(to_tsvector('english', coalesce(category, '')), 'B') || " +
                "setweight(to_tsvector('english', coalesce(description, '')), 'C')" +
                ")"
            );
            System.out.println("PostgreSQL Full-Text Search GIN index checked/created successfully.");
        } catch (Exception e) {
            System.err.println("Failed to create GIN search index: " + e.getMessage());
        }
    }
}
