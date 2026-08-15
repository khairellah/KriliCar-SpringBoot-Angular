package com.kriliCar.controllers;

import com.kriliCar.dtos.responses.AdminKpiDTO;
import com.kriliCar.services.interfaces.AdminKpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * US-8.1 : Contrôleur dédié aux KPI globaux de la plateforme (vue Admin).
 * Séparé de AdminController (gestion de profil) pour respecter la séparation
 * des responsabilités : reporting vs gestion de compte.
 */
@RestController
@RequestMapping("/api/v1/admins/kpi")
@RequiredArgsConstructor
public class AdminKpiController {

    private final AdminKpiService adminKpiService;

    @GetMapping(value = "/global", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<AdminKpiDTO> getGlobalKpi() {
        return ResponseEntity.ok(adminKpiService.getGlobalKpi());
    }
}