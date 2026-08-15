package com.kriliCar.controllers;

import com.kriliCar.dtos.responses.ClientAdminSummaryDTO;
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
}