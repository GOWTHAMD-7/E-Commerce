package e_commerce.com.example.e.commerce.models;

public enum InteractionType {
    VIEW(1),
    SEARCH(2),
    WISHLIST(3),
    CART(4),
    PURCHASE(5);

    private final int weight;

    InteractionType(int weight) {
        this.weight = weight;
    }

    public int getWeight() {
        return weight;
    }
}
