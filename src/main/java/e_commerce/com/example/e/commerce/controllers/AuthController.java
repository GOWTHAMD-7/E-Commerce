package e_commerce.com.example.e.commerce.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {



    @GetMapping("/home")
    public String home() {
        return "Welcome to the E-commerce application!";
    }
}
