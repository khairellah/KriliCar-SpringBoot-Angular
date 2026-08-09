package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.ClientDisplayDTO;
import com.kriliCar.dtos.ClientProfileRequest;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface ClientService {
    // US-1.5 : Modification du profil (infos perso + image)
    ClientDisplayDTO updateProfile(String email, ClientProfileRequest request, MultipartFile imageFile) throws IOException;

    // US-1.5 (ext) : Changement sécurisé du mot de passe
    ClientDisplayDTO changePassword(String email, ChangePasswordRequest request);
}