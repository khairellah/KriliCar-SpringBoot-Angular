package com.kriliCar.controllers;

import com.kriliCar.dtos.ClientDisplayDTO;
import com.kriliCar.dtos.ClientProfileRequest;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import com.kriliCar.services.interfaces.ClientService;
import jakarta.validation.Valid;
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

    /**
     * US-1.5 : Modifier le profil Client.
     */
    @PutMapping(
            value = "/profile",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<ClientDisplayDTO> updateProfile(
            @RequestPart("data") ClientProfileRequest request,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            Principal principal) throws IOException {

        ClientDisplayDTO updated = clientService.updateProfile(principal.getName(), request, imageFile);
        return ResponseEntity.ok(updated);
    }

    /**
     * US-1.5 (extension) : Récupérer le profil du client connecté.
     * Permet au Front de pré-remplir le formulaire avant modification.
     */
    @GetMapping(
            value = "/profile",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<ClientDisplayDTO> getMyProfile(Principal principal) {
        ClientDisplayDTO profile = clientService.getMyProfile(principal.getName());
        return ResponseEntity.ok(profile);
    }

    /**
     * US-1.5 (extension) : Changer le mot de passe.
     */
    @PutMapping(
            value = "/profile/change-password",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<ClientDisplayDTO> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Principal principal) {

        ClientDisplayDTO response = clientService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(response);
    }
}