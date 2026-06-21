package e_commerce.com.example.e.commerce;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import e_commerce.com.example.e.commerce.repos.VerificationTokenRepository;
import java.io.FileWriter;
import java.io.IOException;

@SpringBootTest
class ApplicationTests {

	@Autowired
	private VerificationTokenRepository verificationTokenRepository;

	@Test
	void contextLoads() {
	}

	@Test
	void writeOtpToFile() throws IOException {
		verificationTokenRepository.findByEmail("otp-test-1@example.com")
			.ifPresentOrElse(token -> {
				try (FileWriter writer = new FileWriter("otp.txt")) {
					writer.write(token.getToken());
					System.out.println("OTP_WRITTEN_TO_FILE: " + token.getToken());
				} catch (IOException e) {
					e.printStackTrace();
				}
			}, () -> {
				System.out.println("NO_OTP_FOUND_FOR_EMAIL");
			});
	}

}
