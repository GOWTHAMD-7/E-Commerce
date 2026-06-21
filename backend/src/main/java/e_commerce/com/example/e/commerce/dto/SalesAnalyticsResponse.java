package e_commerce.com.example.e.commerce.dto;

public class SalesAnalyticsResponse {
    private double totalRevenue;
    private long totalItemsSold;
    private long totalOrdersCount;

    public SalesAnalyticsResponse() {}

    public SalesAnalyticsResponse(double totalRevenue, long totalItemsSold, long totalOrdersCount) {
        this.totalRevenue = totalRevenue;
        this.totalItemsSold = totalItemsSold;
        this.totalOrdersCount = totalOrdersCount;
    }

    public double getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(double totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getTotalItemsSold() {
        return totalItemsSold;
    }

    public void setTotalItemsSold(long totalItemsSold) {
        this.totalItemsSold = totalItemsSold;
    }

    public long getTotalOrdersCount() {
        return totalOrdersCount;
    }

    public void setTotalOrdersCount(long totalOrdersCount) {
        this.totalOrdersCount = totalOrdersCount;
    }
}
