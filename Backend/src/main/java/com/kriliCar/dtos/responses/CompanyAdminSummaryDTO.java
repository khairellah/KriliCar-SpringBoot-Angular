package com.kriliCar.dtos.responses;

import com.kriliCar.enums.City;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO de synthèse d'une Company, destiné exclusivement à la vue Admin (US-7.1).
 *
 * Différence avec CompanyProfileResponse (DTO "self-service" de la Company) :
 * - Expose le champ `active` (statut du compte), non pertinent pour l'auto-consultation
 *   par la Company elle-même, mais indispensable pour le listing/filtrage Admin.
 * - Reste volontairement synthétique (pas de description longue) : c'est une liste,
 *   pas une fiche détaillée (le détail complet fera l'objet de l'US-7.5).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyAdminSummaryDTO {

    private String code;
    private String companyName;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private City city;

    // Statut du compte (US-1.8 / US-7.2)
    private Boolean active;

    // Statut Boost (US-6.1 / US-6.2)
    private Boolean isBooster;
    private Boolean boostRequested;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
