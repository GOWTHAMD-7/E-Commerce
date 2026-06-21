package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.dto.MessageResponse;
import e_commerce.com.example.e.commerce.models.Address;
import e_commerce.com.example.e.commerce.services.AddressService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:5174")
@RestController
@RequestMapping("/api/address")
public class AddressController {

    private final AddressService addressService;

    @Autowired
    public AddressController(AddressService addressService) {
        this.addressService = addressService;
    }

    private String getLoggedInUserEmail() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping
    public ResponseEntity<List<Address>> getUserAddresses() {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(addressService.getAddressesForUser(email));
    }

    @PostMapping
    public ResponseEntity<Address> saveAddress(@RequestBody Address address) {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(addressService.saveAddress(email, address));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Address> updateAddress(@PathVariable("id") Long id, @RequestBody Address updatedAddress) {
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(addressService.updateAddress(email, id, updatedAddress));
    }

    @PutMapping("/{id}/default")
    public ResponseEntity<Address> setDefaultAddress(@PathVariable("id") Long id) {
        System.out.println("address id from frontend : " + id);
        String email = getLoggedInUserEmail();
        return ResponseEntity.ok(addressService.setDefaultAddress(email, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteAddress(@PathVariable("id") Long id) {
        String email = getLoggedInUserEmail();
        addressService.deleteAddress(email, id);
        return ResponseEntity.ok(new MessageResponse("Address deleted successfully"));
    }
}
