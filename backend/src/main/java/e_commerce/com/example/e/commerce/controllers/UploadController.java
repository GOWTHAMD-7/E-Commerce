package e_commerce.com.example.e.commerce.controllers;

import e_commerce.com.example.e.commerce.services.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/upload", "/api/upload"})
public class UploadController {

    private final CloudinaryService cloudinaryService;

    @PostMapping("")
    public String uploadImage(@RequestParam("image") MultipartFile image)
            throws IOException {

        return cloudinaryService.uploadImage(image);
    }
}
