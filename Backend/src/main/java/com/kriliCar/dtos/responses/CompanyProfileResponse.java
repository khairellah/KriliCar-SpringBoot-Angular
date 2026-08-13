package com.kriliCar.dtos.responses;

import com.kriliCar.enums.City;
import lombok.*;
import java.time.LocalDateTime;

/**
 * DTO de réponse pour la modification du profil Company. et la gestion du Boost.
 * N'expose PAS le mot de passe, le rôle, ou les timestamps internes de BaseEntity.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyProfileResponse {

    private String code;  // Identifiant métier
    private String firstName;
    private String lastName;
    private String email;  // Affichage uniquement, non modifiable
    private String phone;
    private String image;

    // Champs spécifiques Company
    private String companyName;
    private String landline;
    private City city;
    private String description;

    // --- Option Boost (US-6.1 / US-6.2) ---
    private Boolean isBooster;
    private Boolean boostRequested;
    private LocalDateTime boostRequestedAt;
    private LocalDateTime boostActivatedAt;

    // Metadata utile
    private LocalDateTime updatedAt;
}