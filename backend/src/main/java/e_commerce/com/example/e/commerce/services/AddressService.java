package e_commerce.com.example.e.commerce.services;

import e_commerce.com.example.e.commerce.models.Address;
import e_commerce.com.example.e.commerce.models.User;
import e_commerce.com.example.e.commerce.repos.AddressRepository;
import e_commerce.com.example.e.commerce.repos.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class AddressService {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @Autowired
    public AddressService(AddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public List<Address> getAddressesForUser(String email) {
        return addressRepository.findByUserEmail(email);
    }

    public Address saveAddress(String email, Address address) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        address.setUser(user);

        List<Address> existingAddresses = addressRepository.findByUserEmail(email);
        if (existingAddresses.isEmpty() || address.isDefault()) {
            address.setDefault(true);
            for (Address addr : existingAddresses) {
                addr.setDefault(false);
                addressRepository.save(addr);
            }
        } else {
            address.setDefault(false);
        }

        return addressRepository.save(address);
    }

    public Address updateAddress(String email, Long id, Address updatedAddress) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address existing = addressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!existing.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized address update");
        }

        existing.setFullName(updatedAddress.getFullName());
        existing.setPhoneNumber(updatedAddress.getPhoneNumber());
        existing.setAddressLine1(updatedAddress.getAddressLine1());
        existing.setAddressLine2(updatedAddress.getAddressLine2());
        existing.setCity(updatedAddress.getCity());
        existing.setState(updatedAddress.getState());
        existing.setCountry(updatedAddress.getCountry());
        existing.setPincode(updatedAddress.getPincode());

        if (updatedAddress.isDefault() && !existing.isDefault()) {
            List<Address> existingAddresses = addressRepository.findByUserEmail(email);
            for (Address addr : existingAddresses) {
                if (!addr.getId().equals(existing.getId())) {
                    addr.setDefault(false);
                    addressRepository.save(addr);
                }
            }
            existing.setDefault(true);
        }

        return addressRepository.save(existing);
    }

    public void deleteAddress(String email, Long id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Address existing = addressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if (!existing.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized address deletion");
        }

        boolean wasDefault = existing.isDefault();

        addressRepository.delete(existing);

        if (wasDefault) {
            List<Address> remaining = addressRepository.findByUserEmail(email);
            if (!remaining.isEmpty()) {
                Address first = remaining.get(0);
                first.setDefault(true);
                addressRepository.save(first);
            }
        }
    }

    public Address setDefaultAddress(String email, Long addressId) {
        List<Address> userAddresses = addressRepository.findByUserEmail(email);

        // Validate ownership up-front to prevent setting other records to false if requested ID is invalid
        Address targetAddress = userAddresses.stream()
                .filter(addr -> addr.getId().equals(addressId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Address not found or unauthorized"));

        // Only save changes for records whose default status actually changes
        for (Address addr : userAddresses) {
            boolean shouldBeDefault = addr.getId().equals(addressId);
            if (addr.isDefault() != shouldBeDefault) {
                addr.setDefault(shouldBeDefault);
                addressRepository.save(addr);
            }
        }

        return targetAddress;
    }
}
