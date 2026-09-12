package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.InteractionType;
import e_commerce.com.example.e.commerce.models.Product;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.models.UserInteraction;
import e_commerce.com.example.e.commerce.repos.UserInteractionRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserInteractionService {

    @Autowired
    private UserInteractionRepo userInteractionRepo;

    private static final int MAX_INTERACTIONS_PER_USER = 50;

    @Transactional
    public void recordInteraction(User user, Product product, InteractionType type, String searchQuery) {
        if (user == null) {
            return; // Silently ignore unauthenticated interactions
        }

        if (type == InteractionType.SEARCH && (searchQuery == null || searchQuery.trim().isEmpty())) {
            return; // Ignore empty searches
        }
        
        if (type != InteractionType.SEARCH && product == null) {
            throw new IllegalArgumentException("Product cannot be null for interaction type: " + type);
        }

        UserInteraction interaction = UserInteraction.builder()
                .user(user)
                .product(product)
                .interactionType(type)
                .searchQuery(searchQuery)
                .weight(type.getWeight())
                .build();

        userInteractionRepo.save(interaction);

        enforceLimit(user);
    }

    private void enforceLimit(User user) {
        long count = userInteractionRepo.countByUser(user);
        
        if (count > MAX_INTERACTIONS_PER_USER) {
            int excess = (int) (count - MAX_INTERACTIONS_PER_USER);
            
            // Delete the oldest interaction with the lowest weight (Option A placeholder algorithm)
            List<UserInteraction> toDelete = userInteractionRepo.findByUserOrderedForPruning(user, PageRequest.of(0, excess));
            userInteractionRepo.deleteAll(toDelete);
        }
    }

    public long getInteractionCount(User user) {
        if (user == null) return 0;
        return userInteractionRepo.countByUser(user);
    }
    
    public List<UserInteraction> getUserInteractions(User user) {
        return userInteractionRepo.findByUserOrderByCreatedAtDesc(user);
    }
}
