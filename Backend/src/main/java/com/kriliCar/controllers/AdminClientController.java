package com.kriliCar.controllers;

import com.kriliCar.dtos.responses.ClientAdminSummaryDTO;
import com.kriliCar.dtos.responses.ClientDetailResponse;
import com.kriliCar.services.interfaces.ClientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur Admin pour la gestion des comptes Client.
 *
 * Endpoints :
 * - GET /api/v1/admins/clients : Liste filtrable des clients (US-7.3)
 *
 * NOTE : L'activation/désactivation (US-7.4) sera ajoutée ici, sur le même
 * modèle que AdminCompanyController.activate/deactivate (US-7.2).
 */
@RestController
@RequestMapping("/api/v1/admins/clients")
@RequiredArgsConstructor
public class AdminClientController {

    private final ClientService clientService;

    /**
     * US-7.3 : Liste des clients, avec filtre optionnel :
     * - active : true/false (statut du compte) — absent = tous
     *
     * Exemples :
     *   GET /api/v1/admins/clients               → tous les clients
     *   GET /api/v1/admins/clients?active=false   → comptes désactivés uniquement
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<ClientAdminSummaryDTO>> getClients(
            @RequestParam(required = false) Boolean active) {
        return ResponseEntity.ok(clientService.getClients(active));
    }

    /**
     * US-7.5 : Détail complet d'un client (profil, réservations, wishlist, statistiques).
     */
    @GetMapping(value = "/{code}", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ClientDetailResponse> getClientDetail(@PathVariable String code) {
        return ResponseEntity.ok(clientService.getClientDetail(code));
    }

    /**
     * US-7.4 : Active le compte d'un Client.
     * 409 si déjà actif (idempotence).
     */
    @PatchMapping(value = "/{code}/activate", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ClientAdminSummaryDTO> activateClient(@PathVariable String code) {
        return ResponseEntity.ok(clientService.setClientActiveStatus(code, true));
    }

    /**
     * US-7.4 : Désactive le compte d'un Client (blocage d'accès sans suppression des données).
     * 409 si déjà désactivé (idempotence).
     * Effet immédiat : login bloqué (403 via DisabledException) + tout JWT déjà émis
     * devient inopérant dès la requête suivante (JwtAuthTokenFilter vérifie isEnabled()).
     */
    @PatchMapping(value = "/{code}/deactivate", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ClientAdminSummaryDTO> deactivateClient(@PathVariable String code) {
        return ResponseEntity.ok(clientService.setClientActiveStatus(code, false));
    }
}