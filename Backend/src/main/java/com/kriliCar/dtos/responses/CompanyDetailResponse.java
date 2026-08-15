package com.kriliCar.dtos.responses;

import com.kriliCar.dtos.CarDTO;
import com.kriliCar.enums.City;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * US-7.5 : Détail complet d'une société pour la vue Admin.
 * Composé de 3 blocs : profil complet, liste des voitures, statistiques.
 * Vue en lecture seule, jamais utilisée pour de la mutation.
 */
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CompanyDetailResponse {

    // --- Profil complet ---
    private String code;
    private String companyName;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String image;
    private String landline;
    private City city;
    private String description;
    private Boolean active;
    private Boolean isBooster;
    private Boolean boostRequested;
    private LocalDateTime boostRequestedAt;
    private LocalDateTime boostActivatedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // --- Voitures ---
    private List<CarDTO> cars;

    // --- Statistiques ---
    private CompanyStatsDTO stats;
}