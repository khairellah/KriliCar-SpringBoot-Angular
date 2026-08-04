package com.kriliCar.services.impl;

import com.kriliCar.dtos.registration.ClientRegistrationDTO;
import com.kriliCar.dtos.registration.ClientRegistrationResponseDTO;
import com.kriliCar.dtos.registration.CompanyRegistrationDTO;
import com.kriliCar.dtos.registration.CompanyRegistrationResponseDTO;
import com.kriliCar.entities.Client;
import com.kriliCar.entities.Company;
import com.kriliCar.enums.Role;
import com.kriliCar.exceptions.DuplicateResourceException;
import com.kriliCar.repositories.AppUserRepository;
import com.kriliCar.repositories.ClientRepository;
import com.kriliCar.repositories.CompanyRepository;
import com.kriliCar.services.interfaces.AuthService;
import com.kriliCar.services.interfaces.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    // Dépendances critiques pour l'enregistrement
    private final AppUserRepository appUserRepository;
    private final ClientRepository clientRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    // Ajoutez la dépendance :
    private final FileService fileService;

    // ------------------------- ENREGISTREMENT CLIENT -------------------------
    @Override
    public ClientRegistrationResponseDTO registerClient(ClientRegistrationDTO registrationDTO, MultipartFile imageFile)  throws IOException {

        // 1. Vérification de l'unicité de l'email
        if (appUserRepository.findByEmail(registrationDTO.getEmail()).isPresent()) {
            throw new DuplicateResourceException("Utilisateur", "email", registrationDTO.getEmail());
        }

        // 2. Hachage du mot de passe
        String hashedPassword = passwordEncoder.encode(registrationDTO.getPassword());

        // --- LOGIQUE D'UPLOAD NOUVELLE ---
        String imagePath = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            // Appelle le FileService en utilisant le sous-dossier "Client"
            imagePath = fileService.uploadFile(imageFile, "Client");
        }

        // 3. Conversion DTO -> Entité Client
        Client client = Client.builder()
                .firstName(registrationDTO.getFirstName())
                .lastName(registrationDTO.getLastName())
                .email(registrationDTO.getEmail())
                .password(hashedPassword) // Utilisation du mot de passe haché
                .phone(registrationDTO.getPhone())
                .image(imagePath) // <-- Le chemin est défini ici (correct)
                .role(Role.CLIENT) // <-- Définition du rôle CLIENT
                .build();

        // 4. Sauvegarde
        clientRepository.save(client);

        // 5. Retourne un DTO de confirmation (sans le mot de passe)
        return ClientRegistrationResponseDTO.builder()
                .code(client.getCode())
                .firstName(client.getFirstName())
                .lastName(client.getLastName())
                .email(client.getEmail())
                .phone(client.getPhone())
                .image(client.getImage()) // <-- CORRECTION CLÉ : Utiliser client.getImage()
                .build();
    }

    // ------------------------- ENREGISTREMENT COMPANY -------------------------
    @Override
    public CompanyRegistrationResponseDTO registerCompany(CompanyRegistrationDTO registrationDTO, MultipartFile imageFile) throws IOException {

        // 1. Vérification de l'unicité de l'email
        if (appUserRepository.findByEmail(registrationDTO.getEmail()).isPresent()) {
            throw new DuplicateResourceException("Company", "email", registrationDTO.getEmail());
        }

        // 2. Hachage du mot de passe
        String hashedPassword = passwordEncoder.encode(registrationDTO.getPassword());

        // 3. Gestion de l'upload d'image
        String imagePath = null;
        if (imageFile != null && !imageFile.isEmpty()) {
            imagePath = fileService.uploadFile(imageFile, "Company");
        }

        // 4. Conversion DTO -> Entité Company
        Company company = Company.builder()
                .firstName(registrationDTO.getFirstName())
                .lastName(registrationDTO.getLastName())
                .email(registrationDTO.getEmail())
                .password(hashedPassword)
                .phone(registrationDTO.getPhone())
                .image(imagePath)
                .role(Role.COMPANY)
                .companyName(registrationDTO.getCompanyName())
                .landline(registrationDTO.getLandline())
                .city(registrationDTO.getCity())
                .description(registrationDTO.getDescription())
                // 🔒 CORRECTION SÉCURITÉ (US-1.3) : isBooster est TOUJOURS forcé à false
                // à l'inscription, indépendamment de toute donnée envoyée par le client.
                // Il ne peut être activé que par l'Admin via le flux Boost (US-6.2).
                .isBooster(false)
                .build();

        // 5. Sauvegarde
        companyRepository.save(company);

        // 6. Retourne un DTO de confirmation
        return CompanyRegistrationResponseDTO.builder()
                .code(company.getCode())
                .firstName(company.getFirstName())
                .lastName(company.getLastName())
                .email(company.getEmail())
                .phone(company.getPhone())
                .image(company.getImage())
                .companyName(company.getCompanyName())
                .landline(company.getLandline())
                .city(company.getCity())
                .description(company.getDescription())
                .isBooster(company.getIsBooster())
                .build();
    }
}
