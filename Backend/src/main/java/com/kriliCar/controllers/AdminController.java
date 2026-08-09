package com.kriliCar.controllers;

import com.kriliCar.dtos.AdminProfileRequest;
import com.kriliCar.dtos.UserDisplayDTO;
import com.kriliCar.dtos.auth.ChangePasswordRequest;
import com.kriliCar.services.interfaces.AdminService;
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
 * US-1.6 : Gestion du profil Admin.
 * - PUT /api/v1/admins/profile : infos personnelles + image
 * - PUT /api/v1/admins/profile/change-password : mot de passe (flux dédié)
 */
@RestController
@RequestMapping("/api/v1/admins")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @PutMapping(
            value = "/profile",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserDisplayDTO> updateProfile(
            @RequestPart("data") AdminProfileRequest request,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            Principal principal) throws IOException {

        UserDisplayDTO updated = adminService.updateProfile(principal.getName(), request, imageFile);
        return ResponseEntity.ok(updated);
    }

    @PutMapping(
            value = "/profile/change-password",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<UserDisplayDTO> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Principal principal) {

        UserDisplayDTO updated = adminService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(updated);
    }
}