package com.kriliCar.services.impl;

import com.kriliCar.dtos.ClientDisplayDTO;
import com.kriliCar.dtos.ClientProfileRequest;
import com.kriliCar.entities.Client;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.mappers.ClientMapper;
import com.kriliCar.repositories.ClientRepository;
import com.kriliCar.services.interfaces.ClientService;
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
public class ClientServiceImpl implements ClientService {

    private final ClientRepository clientRepository;
    private final FileService fileService;
    private final PasswordEncoder passwordEncoder;
    private final ClientMapper clientMapper;

    @Override
    @Transactional
    public ClientDisplayDTO updateProfile(String email, ClientProfileRequest request, MultipartFile imageFile) throws IOException {

        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Client", "email", email));

        // Mise à jour partielle : seuls les champs non vides sont appliqués
        if (StringUtils.hasText(request.getFirstName())) {
            client.setFirstName(request.getFirstName());
        }
        if (StringUtils.hasText(request.getLastName())) {
            client.setLastName(request.getLastName());
        }
        if (StringUtils.hasText(request.getPhone())) {
            client.setPhone(request.getPhone());
        }
        if (StringUtils.hasText(request.getPassword())) {
            client.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        // Gestion de l'image (remplacement)
        if (imageFile != null && !imageFile.isEmpty()) {
            if (client.getImage() != null) {
                fileService.deleteFile(client.getImage());
            }
            String path = fileService.uploadFile(imageFile, "Client");
            client.setImage(path);
        }

        Client saved = clientRepository.save(client);
        return clientMapper.toDisplayDTO(saved);
    }
}