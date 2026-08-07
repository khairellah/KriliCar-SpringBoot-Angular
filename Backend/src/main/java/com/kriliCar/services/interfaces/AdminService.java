package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.AdminProfileRequest;
import com.kriliCar.dtos.UserDisplayDTO;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface AdminService {

    /**
     * Met à jour le profil de l'Admin authentifié.
     * L'email et le rôle ne sont jamais modifiables.
     */
    UserDisplayDTO updateProfile(String email, AdminProfileRequest request, MultipartFile imageFile) throws IOException;
}