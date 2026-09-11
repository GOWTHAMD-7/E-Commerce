package e_commerce.com.example.e.commerce;

import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.services.ProductService;
import e_commerce.com.example.e.commerce.services.SemanticSearchService;
import e_commerce.com.example.e.commerce.services.HybridSearchService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

@SpringBootTest
public class HybridSearchBenchmarkTest {

    @Autowired
    private ProductService productService;

    @Autowired
    private SemanticSearchService semanticSearchService;

    @Autowired
    private HybridSearchService hybridSearchService;

    private static final String[] QUERIES = {
        "Nike black shirt",
        "black oversized t-shirt",
        "comfortable clothes for summer",
        "something warm for winter",
        "blak tshirt",
        "oversizd cotton tee",
        "black cotton oversized shirt",
        "slim fit white polo"
    };

    @Test
    public void runBenchmark() {
        System.out.println("=================================================");
        System.out.println("HYBRID SEARCH BENCHMARK");
        System.out.println("=================================================");

        // Warm up the embedding model
        semanticSearchService.search("warmup", 5);

        for (String query : QUERIES) {
            System.out.println("\n--- Query: \"" + query + "\" ---");

            // 1. Keyword Search
            long startK = System.currentTimeMillis();
            List<Product> keywordRes = null;
            try {
                // searchProducts returns DTOs, so we'll just time it
                productService.searchProducts(query);
            } catch (Exception e) {}
            long timeK = System.currentTimeMillis() - startK;

            // 2. Semantic Search
            long startS = System.currentTimeMillis();
            List<Product> semanticRes = semanticSearchService.search(query, 10);
            long timeS = System.currentTimeMillis() - startS;

            // 3. Hybrid Search
            long startH = System.currentTimeMillis();
            List<Product> hybridRes = hybridSearchService.search(query, 0, 10);
            long timeH = System.currentTimeMillis() - startH;

            System.out.println(String.format("Keyword  Time: %3d ms", timeK));
            System.out.println(String.format("Semantic Time: %3d ms | Results: %d", timeS, semanticRes.size()));
            System.out.println(String.format("Hybrid   Time: %3d ms | Results: %d", timeH, hybridRes.size()));

            System.out.println("Top Hybrid Results:");
            for (int i = 0; i < Math.min(3, hybridRes.size()); i++) {
                Product p = hybridRes.get(i);
                System.out.println("  " + (i+1) + ". " + p.getName() + " (" + p.getCategory() + ")");
            }
        }

        System.out.println("\n=================================================");
        System.out.println("CANDIDATE MULTIPLIER BENCHMARK (Query: 'black oversized t-shirt')");
        String q = "black oversized t-shirt";
        
        int[] multipliers = {2, 3, 4};
        for (int m : multipliers) {
            HybridSearchService.setCandidateMultiplier(m);
            long start = System.currentTimeMillis();
            List<Product> res = hybridSearchService.search(q, 0, 48);
            long time = System.currentTimeMillis() - start;
            System.out.println("Multiplier " + m + " | Time: " + time + " ms | Returned: " + res.size());
        }
        
        // Reset to default
        HybridSearchService.setCandidateMultiplier(3);
        
        System.out.println("\n=================================================");
        System.out.println("PAGINATION TEST (Query: 'black oversized t-shirt')");
        List<Product> page0 = hybridSearchService.search(q, 0, 48);
        List<Product> page1 = hybridSearchService.search(q, 1, 24); // Wait, offset is page*limit, so offset=24.
        // Wait! The user test was: page=0 limit=48, then page=1 limit=24 (offset 24?), page=2 limit=24.
        // But our UI uses offset = page * limit. If we request page=2, limit=24, offset=48.
        // So I'll test page=0, limit=48. Then page=2, limit=24. Then page=3, limit=24.
        List<Product> page2 = hybridSearchService.search(q, 2, 24);
        List<Product> page3 = hybridSearchService.search(q, 3, 24);
        
        System.out.println("Page 0 (L=48) returns: " + page0.size());
        System.out.println("Page 2 (L=24) returns: " + page2.size());
        System.out.println("Page 3 (L=24) returns: " + page3.size());
        
        // Check for duplicates between page 0 and page 2
        boolean duplicateFound = false;
        for(Product p2 : page2) {
            for(Product p0 : page0) {
                if (p2.getId().equals(p0.getId())) duplicateFound = true;
            }
        }
        System.out.println("Duplicates between Page 0 and Page 2: " + duplicateFound);
    }
}
