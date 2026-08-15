package com.kriliCar.controllers;

import com.kriliCar.dtos.responses.CompanyKpiDTO;
import com.kriliCar.services.interfaces.CompanyKpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * US-8.2 : Contrôleur dédié aux KPI de la Company authentifiée (§5.5 spec).
 * Scope automatiquement restreint via le token — jamais de paramètre companyCode libre,
 * en cohérence avec le pattern déjà utilisé pour /cars/my-fleet (US-3.4).
 */
@RestController
@RequestMapping("/api/v1/companies/kpi")
@RequiredArgsConstructor
public class CompanyKpiController {

    private final CompanyKpiService companyKpiService;

    @GetMapping(value = "/my", produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasAuthority('COMPANY')")
    public ResponseEntity<CompanyKpiDTO> getMyKpi(Principal principal) {
        return ResponseEntity.ok(companyKpiService.getMyKpi(principal.getName()));
    }
}