package com.kriliCar.services.impl;

import com.kriliCar.dtos.registration.ClientRegistrationDTO;
import com.kriliCar.dtos.registration.ClientRegistrationResponseDTO;
import com.kriliCar.entities.Client;
import com.kriliCar.enums.Role;
import com.kriliCar.exceptions.DuplicateResourceException;
import com.kriliCar.repositories.AppUserRepository;
import com.kriliCar.repositories.ClientRepository;
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
}
