package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.registration.ClientRegistrationDTO;
import com.kriliCar.dtos.registration.ClientRegistrationResponseDTO;
import com.kriliCar.dtos.registration.CompanyRegistrationDTO;
import com.kriliCar.dtos.registration.CompanyRegistrationResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface AuthService {
    // Prend le fichier en plus des données
    ClientRegistrationResponseDTO registerClient(ClientRegistrationDTO registrationDTO, MultipartFile imageFile) throws IOException;
    // Prend le fichier en plus des données
    CompanyRegistrationResponseDTO registerCompany(CompanyRegistrationDTO registrationDTO, MultipartFile imageFile) throws IOException;

}
