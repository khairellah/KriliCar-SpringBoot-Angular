package com.kriliCar.controllers;

import com.kriliCar.dtos.responses.CompanyProfileResponse;
import com.kriliCar.services.interfaces.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur Admin pour la gestion du Boost des sociétés.
 *
 * Endpoints :
 * - GET   /api/v1/admin/companies/boost/pending        : Liste des demandes de Boost en attente (US-6.2)
 * - PATCH /api/v1/admin/companies/{code}/boost/activate : Validation/Activation du Boost (US-6.2)
 *
 * NOTE : Ce contrôleur a vocation à être enrichi lors du Sprint 7
 * (US-7.1 à US-7.5 : liste des sociétés/clients, activation/désactivation de comptes).
 */
@RestController
@RequestMapping("/api/v1/admins/companies")
@RequiredArgsConstructor
public class AdminCompanyController {

    private final CompanyService companyService;

    /**
     * US-6.2 : Liste des sociétés ayant une demande de Boost en attente.
     * Permet à l'Admin de visualiser les demandes à traiter (triables côté front
     * sur boostRequestedAt pour prioriser les plus anciennes).
     */
    @GetMapping(value = "/boost/pending", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<CompanyProfileResponse>> getPendingBoostRequests() {
        return ResponseEntity.ok(companyService.getPendingBoostRequests());
    }

    /**
     * US-6.2 : Validation/Activation du Boost pour une société donnée.
     *
     * ✅ Rôle ADMIN requis
     * ✅ Rejette (409) si aucune demande n'est en attente pour cette société
     * ✅ Rejette (409) si le Boost est déjà actif
     */
    @PatchMapping(value = "/{code}/boost/activate", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<CompanyProfileResponse> activateBoost(@PathVariable String code) {
        return ResponseEntity.ok(companyService.activateBoost(code));
    }
}