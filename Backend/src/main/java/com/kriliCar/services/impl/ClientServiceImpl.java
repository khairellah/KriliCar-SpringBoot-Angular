package com.kriliCar.services.impl;

import com.kriliCar.dtos.ClientDisplayDTO;
import com.kriliCar.dtos.ClientProfileRequest;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import com.kriliCar.entities.Client;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.exceptions.UnauthorizedActionException;
import com.kriliCar.mappers.ClientMapper;
import com.kriliCar.repositories.ClientRepository;
import com.kriliCar.services.interfaces.ClientService;
import com.kriliCar.services.interfaces.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final FileService fileService;
    private final PasswordEncoder passwordEncoder;
    private final ClientMapper clientMapper;

    /**
     * US-1.5 : Modifier le profil Client (infos perso + image).
     * ⚠️ Email et rôle non modifiables. Mot de passe non modifiable ici (cf. changePassword).
     */
    @Override
    @Transactional
    public ClientDisplayDTO updateProfile(String email, ClientProfileRequest request, MultipartFile imageFile) throws IOException {

        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "email", email));

        if (StringUtils.hasText(request.getFirstName())) {
            client.setFirstName(request.getFirstName().trim());
        }
        if (StringUtils.hasText(request.getLastName())) {
            client.setLastName(request.getLastName().trim());
        }
        if (StringUtils.hasText(request.getPhone())) {
            client.setPhone(request.getPhone().trim());
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            if (StringUtils.hasText(client.getImage())) {
                fileService.deleteFile(client.getImage());
            }
            String path = fileService.uploadFile(imageFile, "Client");
            client.setImage(path);
        }

        Client saved = clientRepository.save(client);
        log.info("Profil modifié avec succès pour le client : {}", saved.getCode());

        return clientMapper.toDisplayDTO(saved);
    }

    /**
     * US-1.5 (extension) : Changement sécurisé du mot de passe.
     * ✅ Vérifie l'ancien mot de passe avant modification
     * ✅ Encodage BCrypt du nouveau mot de passe
     */
    @Override
    @Transactional
    public ClientDisplayDTO changePassword(String email, ChangePasswordRequest request) {

        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "email", email));

        if (!passwordEncoder.matches(request.getOldPassword(), client.getPassword())) {
            log.warn("Tentative de changement de mot de passe avec ancien mot de passe incorrect pour : {}", client.getCode());
            throw new UnauthorizedActionException("L'ancien mot de passe est incorrect.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), client.getPassword())) {
            throw new IllegalArgumentException("Le nouveau mot de passe doit être différent de l'ancien.");
        }

        client.setPassword(passwordEncoder.encode(request.getNewPassword()));
        Client saved = clientRepository.save(client);
        log.info("Mot de passe modifié avec succès pour le client : {}", saved.getCode());

        return clientMapper.toDisplayDTO(saved);
    }
}