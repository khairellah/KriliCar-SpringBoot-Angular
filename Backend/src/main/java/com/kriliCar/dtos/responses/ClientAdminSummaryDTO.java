package com.kriliCar.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de synthèse d'un Client, destiné exclusivement à la vue Admin (US-7.3).
 *
 * Différence avec ClientDisplayDTO (DTO "self-service" du Client, hérité de
 * UserDisplayDTO) : expose le champ `active`, non pertinent pour l'auto-consultation
 * mais indispensable pour le listing/filtrage Admin (US-7.3) et pour l'activation/
 * désactivation (US-7.4).
 *
 * Pas de champs Boost (concept propre aux Company, cf. CompanyAdminSummaryDTO).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientAdminSummaryDTO {

    private String code;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    // Statut du compte (US-1.8 / US-7.4)
    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}