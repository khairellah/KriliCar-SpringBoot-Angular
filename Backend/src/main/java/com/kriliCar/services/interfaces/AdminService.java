package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.AdminProfileRequest;
import com.kriliCar.dtos.UserDisplayDTO;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface AdminService {

    /**
     * US-1.6 : Modifie les informations personnelles de l'Admin (hors mot de passe).
     * Email et rôle non modifiables.
     */
    UserDisplayDTO updateProfile(String email, AdminProfileRequest request, MultipartFile imageFile) throws IOException;

    /**
     * US-1.6 (extension) : Change le mot de passe de l'Admin.
     * Vérifie l'ancien mot de passe avant remplacement.
     */
    UserDisplayDTO changePassword(String email, ChangePasswordRequest request);
}