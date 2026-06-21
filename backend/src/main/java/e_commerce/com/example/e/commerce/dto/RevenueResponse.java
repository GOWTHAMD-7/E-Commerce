package e_commerce.com.example.e.commerce.dto;

public class RevenueResponse {
    private double revenue;

    public RevenueResponse() {}

    public RevenueResponse(double revenue) {
        this.revenue = revenue;
    }

    public double getRevenue() {
        return revenue;
    }

    public void setRevenue(double revenue) {
        this.revenue = revenue;
    }
}
