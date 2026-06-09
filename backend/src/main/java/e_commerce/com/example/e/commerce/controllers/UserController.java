package e_commerce.com.example.e.commerce.controllers;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;


@CrossOrigin(origins = "http://localhost:5174")
@RestController
public class UserController {
    
    @GetMapping("/home")
    public String home() {
        return "Welcome to the E-commerce application!";
    }
}
