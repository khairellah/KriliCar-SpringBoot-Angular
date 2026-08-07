package com.kriliCar.controllers;

import com.kriliCar.dtos.AdminProfileRequest;
import com.kriliCar.dtos.UserDisplayDTO;
import com.kriliCar.services.interfaces.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;

@RestController
@RequestMapping("/api/v1/admins")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @PutMapping(value = "/profile", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')") // Seul le rôle ADMIN accède à cet endpoint
    public ResponseEntity<UserDisplayDTO> updateProfile(
            @RequestPart("data") AdminProfileRequest request,
            @RequestPart(value = "image", required = false) MultipartFile imageFile,
            Principal principal) throws IOException {

        UserDisplayDTO updated = adminService.updateProfile(principal.getName(), request, imageFile);
        return ResponseEntity.ok(updated);
    }
}