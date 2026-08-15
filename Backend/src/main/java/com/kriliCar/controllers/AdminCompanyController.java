package com.kriliCar.controllers;

import com.kriliCar.dtos.responses.CompanyAdminSummaryDTO;
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
     * US-7.1 : Liste des sociétés, avec filtres optionnels et combinables :
     * - active  : true/false (statut du compte) — absent = toutes
     * - boosted : true/false (statut Boost)       — absent = toutes
     *
     * Exemples :
     *   GET /api/v1/admins/companies                          → toutes les sociétés
     *   GET /api/v1/admins/companies?active=false              → comptes désactivés uniquement
     *   GET /api/v1/admins/companies?boosted=true               → sociétés boostées uniquement
     *   GET /api/v1/admins/companies?active=true&boosted=false → actives ET non boostées
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<CompanyAdminSummaryDTO>> getCompanies(
            @RequestParam(required = false) Boolean active,
            @RequestParam(required = false) Boolean boosted) {
        return ResponseEntity.ok(companyService.getCompanies(active, boosted));
    }

    /**
     * US-7.2 : Active le compte d'une Company.
     * 409 si déjà active (idempotence).
     */
    @PatchMapping(value = "/{code}/activate", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<CompanyAdminSummaryDTO> activateCompany(@PathVariable String code) {
        return ResponseEntity.ok(companyService.setCompanyActiveStatus(code, true));
    }

    /**
     * US-7.2 : Désactive le compte d'une Company (blocage d'accès sans suppression des données).
     * 409 si déjà désactivée (idempotence).
     * Effet immédiat : login bloqué (403 via DisabledException) + tout JWT déjà émis
     * devient inopérant dès la requête suivante (JwtAuthTokenFilter vérifie isEnabled()).
     */
    @PatchMapping(value = "/{code}/deactivate", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<CompanyAdminSummaryDTO> deactivateCompany(@PathVariable String code) {
        return ResponseEntity.ok(companyService.setCompanyActiveStatus(code, false));
    }

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