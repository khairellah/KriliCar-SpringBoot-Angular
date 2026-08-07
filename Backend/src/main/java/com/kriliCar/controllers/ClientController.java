package com.kriliCar.controllers;

import com.kriliCar.dtos.ClientDisplayDTO;
import com.kriliCar.dtos.ClientProfileRequest;
import com.kriliCar.services.interfaces.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/clients")
@RequiredArgsConstructor
public class ClientController {

    private final ClientService clientService;

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<ClientDisplayDTO> updateProfile(
            @RequestPart("data") ClientProfileRequest request,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            Principal principal) throws IOException {

        ClientDisplayDTO updated = clientService.updateProfile(principal.getName(), request, imageFile);
        return ResponseEntity.ok(updated);
    }
}