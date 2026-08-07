package com.kriliCar.controllers;

import com.kriliCar.dtos.CompanyProfileRequest;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import com.kriliCar.dtos.responses.CompanyProfileResponse;
import com.kriliCar.services.interfaces.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;

/**
 * Contrôleur pour la gestion des profils Company.
 *
 * Endpoints :
 * - PUT /api/v1/companies/profile : Modification du profil + image
 * - PUT /api/v1/companies/profile/change-password : Changement sécurisé du mot de passe
 */
@RestController
@RequestMapping("/api/v1/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    /**
     * US-1.4 : Modifier le profil Company.
     *
     * ✅ Authentification requise (JWT) + rôle COMPANY
     * ✅ Seule la Company propriétaire du compte peut le modifier
     * ✅ Email et rôle ne sont jamais modifiables
     * ✅ Image optionnelle
     *
     * @param request Données de modification (firstName, lastName, phone, etc.)
     * @param imageFile Image de profil optionnelle
     * @param principal Contexte de sécurité (email du token JWT)
     * @return DTO de réponse sans password
     */
    @PutMapping(
            value = "/profile",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    @PreAuthorize("hasAuthority('COMPANY')")
    public ResponseEntity<CompanyProfileResponse> updateProfile(
            @Valid @RequestPart("data") CompanyProfileRequest request,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            Principal principal) throws IOException {

        String email = principal.getName(); // Email du token JWT
        CompanyProfileResponse updated = companyService.updateProfile(email, request, imageFile);
        return ResponseEntity.ok(updated);
    }

    /**
     * US-1.4 (extension) : Changer le mot de passe de manière sécurisée.
     *
     * ✅ Authentification requise + rôle COMPANY
     * ✅ Vérification de l'ancien mot de passe
     * ✅ Encodage en BCrypt
     * ⚠️ La confirmation (newPassword == confirmPassword) est validée côté Angular
     *
     * @param request Ancien + nouveau mot de passe
     * @param principal Contexte de sécurité (email du token JWT)
     * @return DTO de confirmation (sans password)
     */
    @PutMapping(
            value = "/profile/change-password",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    @PreAuthorize("hasAuthority('COMPANY')")
    public ResponseEntity<CompanyProfileResponse> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Principal principal) {

        String email = principal.getName(); // Email du token JWT
        CompanyProfileResponse response = companyService.changePassword(email, request);
        return ResponseEntity.ok(response);
    }
}