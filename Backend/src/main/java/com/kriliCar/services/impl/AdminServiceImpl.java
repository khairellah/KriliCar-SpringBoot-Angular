package com.kriliCar.services.impl;

import com.kriliCar.dtos.AdminProfileRequest;
import com.kriliCar.dtos.UserDisplayDTO;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import com.kriliCar.entities.Admin;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.exceptions.UnauthorizedActionException;
import com.kriliCar.repositories.AdminRepository;
import com.kriliCar.services.interfaces.AdminService;
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
public class AdminServiceImpl implements AdminService {

    private final AdminRepository adminRepository;
    private final FileService fileService;
    private final PasswordEncoder passwordEncoder;

    // ------------------------- US-1.6 : Mise à jour du profil -------------------------
    @Override
    @Transactional
    public UserDisplayDTO updateProfile(String email, AdminProfileRequest request, MultipartFile imageFile) throws IOException {

        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", "email", email));

        log.info("Début de modification du profil pour l'admin : {}", admin.getCode());

        // Mise à jour partielle — email et role JAMAIS touchés
        if (StringUtils.hasText(request.getFirstName())) {
            admin.setFirstName(request.getFirstName().trim());
        }
        if (StringUtils.hasText(request.getLastName())) {
            admin.setLastName(request.getLastName().trim());
        }
        if (StringUtils.hasText(request.getPhone())) {
            admin.setPhone(request.getPhone().trim());
        }

        // Gestion de la photo de profil
        if (imageFile != null && !imageFile.isEmpty()) {
            if (StringUtils.hasText(admin.getImage())) {
                fileService.deleteFile(admin.getImage());
            }
            String path = fileService.uploadFile(imageFile, "Admin");
            admin.setImage(path);
        }

        Admin saved = adminRepository.save(admin);
        log.info("Profil modifié avec succès pour l'admin : {}", admin.getCode());

        return toDisplayDTO(saved);
    }

    // ------------------------- US-1.6 (ext) : Changement de mot de passe -------------------------
    @Override
    @Transactional
    public UserDisplayDTO changePassword(String email, ChangePasswordRequest request) {

        Admin admin = adminRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", "email", email));

        log.info("Début du changement de mot de passe pour l'admin : {}", admin.getCode());

        if (!passwordEncoder.matches(request.getOldPassword(), admin.getPassword())) {
            log.warn("Ancien mot de passe incorrect pour l'admin : {}", admin.getCode());
            throw new UnauthorizedActionException("L'ancien mot de passe est incorrect.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), admin.getPassword())) {
            throw new IllegalArgumentException("Le nouveau mot de passe doit être différent de l'ancien.");
        }

        admin.setPassword(passwordEncoder.encode(request.getNewPassword()));
        Admin saved = adminRepository.save(admin);

        log.info("Mot de passe modifié avec succès pour l'admin : {}", admin.getCode());
        return toDisplayDTO(saved);
    }

    private UserDisplayDTO toDisplayDTO(Admin admin) {
        UserDisplayDTO dto = new UserDisplayDTO();
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