package com.kriliCar.dtos.responses;

import com.kriliCar.dtos.CarDTO;
import com.kriliCar.dtos.ReservationDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * US-7.5 : Détail complet d'un client pour la vue Admin.
 * Composé de : profil complet, réservations, wishlist, statistiques.
 * Vue en lecture seule.
 */
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ClientDetailResponse {

    // --- Profil complet ---
    private String code;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String image;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // --- Réservations & Wishlist ---
    private List<ReservationDTO> reservations;
    private List<CarDTO> wishlist;

    // --- Statistiques ---
    private ClientStatsDTO stats;
}