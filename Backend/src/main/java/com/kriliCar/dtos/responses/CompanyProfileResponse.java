package com.kriliCar.dtos.responses;

import com.kriliCar.enums.City;
import lombok.*;
import java.time.LocalDateTime;

/**
 * DTO de réponse pour la modification du profil Company.
 * N'expose PAS le mot de passe, le rôle, ou les timestamps internes.
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
    private Boolean isBooster;

    // Metadata utile
    private LocalDateTime updatedAt;
}