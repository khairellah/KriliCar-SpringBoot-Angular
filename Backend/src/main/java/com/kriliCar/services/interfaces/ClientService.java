package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.ClientDisplayDTO;
import com.kriliCar.dtos.ClientProfileRequest;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface ClientService {
    ClientDisplayDTO updateProfile(String email, ClientProfileRequest request, MultipartFile imageFile) throws IOException;
}