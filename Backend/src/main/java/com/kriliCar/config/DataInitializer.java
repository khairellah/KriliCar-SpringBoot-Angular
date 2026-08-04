package com.kriliCar.config;

import com.kriliCar.entities.Admin;
import com.kriliCar.enums.Role;
import com.kriliCar.repositories.AdminRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final AdminRepository adminRepository;

    // Valeurs reprises du code existant (harmonisation avec le cahier des charges - US-1.7)
    private static final String ADMIN_EMAIL = "admin@krili.com";
    private static final String DEFAULT_PASSWORD = "admin@2026";

    @Bean
    public CommandLineRunner initAdminData(PasswordEncoder passwordEncoder) {
        return args -> {
            if (adminRepository.findByEmail(ADMIN_EMAIL).isEmpty()) {
                Admin admin = Admin.builder()
                        .firstName("Super")
                        .lastName("Admin")
                        .email(ADMIN_EMAIL)
                        .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                        .role(Role.ADMIN)
                        .image(null)
                        .build();

                adminRepository.save(admin);
                System.out.println("ADMIN CRÉÉ : " + ADMIN_EMAIL + " | Mot de passe : " + DEFAULT_PASSWORD);
            }
        };
    }
}