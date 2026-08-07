package com.kriliCar.services.impl;

import com.kriliCar.dtos.AdminProfileRequest;
import com.kriliCar.dtos.UserDisplayDTO;
import com.kriliCar.entities.Admin;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.repositories.AdminRepository;
import com.kriliCar.services.interfaces.AdminService;
import com.kriliCar.services.interfaces.FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final AdminRepository adminRepository;
    private final FileService fileService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public UserDisplayDTO updateProfile(String email, AdminProfileRequest request, MultipartFile imageFile) throws IOException {

        // 1. Chargement de l'Admin (email = clé d'identification, jamais modifiée)
        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", "email", email));

        // 2. Mise à jour partielle des champs autorisés
        if (StringUtils.hasText(request.getFirstName())) {
            admin.setFirstName(request.getFirstName());
        }
        if (StringUtils.hasText(request.getLastName())) {
            admin.setLastName(request.getLastName());
        }
        if (StringUtils.hasText(request.getPhone())) {
            admin.setPhone(request.getPhone());
        }

        // 3. Changement de mot de passe (optionnel et sécurisé)
        if (StringUtils.hasText(request.getNewPassword())) {
            if (!StringUtils.hasText(request.getCurrentPassword())
                    || !passwordEncoder.matches(request.getCurrentPassword(), admin.getPassword())) {
                throw new IllegalArgumentException("Mot de passe actuel incorrect.");
            }
            admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        // 4. Gestion de la photo de profil (remplace l'ancienne si présente)
        if (imageFile != null && !imageFile.isEmpty()) {
            if (admin.getImage() != null) {
                fileService.deleteFile(admin.getImage());
            }
            String path = fileService.uploadFile(imageFile, "Admin");
            admin.setImage(path);
        }

        Admin saved = adminRepository.save(admin);

        return toDisplayDTO(saved);
    }

    // Mapping manuel : pas de password exposé dans la réponse
    private UserDisplayDTO toDisplayDTO(Admin admin) {
        UserDisplayDTO dto = new UserDisplayDTO();
        //dto.setId(admin.getId());
        dto.setCode(admin.getCode());
        dto.setFirstName(admin.getFirstName());
        dto.setLastName(admin.getLastName());
        dto.setPhone(admin.getPhone());
        dto.setEmail(admin.getEmail());
        dto.setImage(admin.getImage());
        dto.setRole(admin.getRole());
        return dto;
    }
}