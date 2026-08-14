package e_commerce.com.example.e.commerce.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ViewCountInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Memory-efficient bulk update directly via SQL, avoiding loading thousands of entities into JVM RAM
            int updated = jdbcTemplate.update(
                "UPDATE product SET view_count = floor(random() * 2450 + 50)::bigint WHERE view_count IS NULL OR view_count = 0"
            );
            if (updated > 0) {
                System.out.println("⚡ Fast bulk update: initialized viewCount for " + updated + " products!");
            }
        } catch (Exception e) {
            System.err.println("ViewCountInitializer warning: " + e.getMessage());
        }
    }
}
