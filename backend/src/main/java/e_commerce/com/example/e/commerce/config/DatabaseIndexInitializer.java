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
            /* 
             * DDL execution moved directly to the database via pgAdmin/psql.
             * It is best practice to manage schema changes directly or via tools like Flyway/Liquibase,
             * rather than running CREATE INDEX on every Spring Boot startup, as it avoids lock queues.
             *
             * jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm");
             * jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS product_search_idx ON product USING gin(...)");
             * jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS product_trgm_idx ON product USING gin (name gin_trgm_ops)");
             */

            System.out.println("PostgreSQL Full-Text Search and Trigram indexes are managed directly in the database.");
        } catch (Exception e) {
            System.err.println("Failed to create GIN search index: " + e.getMessage());
        }
    }
}
