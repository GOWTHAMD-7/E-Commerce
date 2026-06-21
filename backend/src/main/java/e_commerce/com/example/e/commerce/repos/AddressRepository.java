package e_commerce.com.example.e.commerce.repos;

import e_commerce.com.example.e.commerce.models.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AddressRepository extends JpaRepository<Address, Long> {
    List<Address> findByUserEmail(String email);
}
