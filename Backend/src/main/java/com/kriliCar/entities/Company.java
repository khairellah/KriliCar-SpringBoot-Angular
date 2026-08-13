package com.kriliCar.entities;


import com.kriliCar.enums.City;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;


@Entity
@Table(name = "companies")
// @PrimaryKeyJoinColumn(name = "company_id")
@Getter @Setter @NoArgsConstructor
@SuperBuilder
public class Company extends AppUser {

    @Column(name = "company_name")
    private String companyName;

    private String landline; // Téléphone fixe

    @Enumerated(EnumType.STRING)
    private City city;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private Boolean isBooster = false;

    /**
     * Indique si une demande de Boost est en attente de validation par l'Admin.
     * Positionné à true par la Company (US-6.1), remis à false lors de la validation (US-6.2).
     */
    @Builder.Default
    @Column(name = "boost_requested")
    private Boolean boostRequested = false;

    /**
     * Horodatage de la dernière demande de Boost effectuée par la Company.
     * Utile pour l'Admin afin de trier les demandes en attente par ancienneté (US-6.2 / US-7.x).
     */
    @Column(name = "boost_requested_at")
    private LocalDateTime boostRequestedAt;

    /**
     * Horodatage de l'activation du Boost par l'Admin.
     * Utile pour un futur audit / KPI "depuis quand la société est boostée".
     */
    @Column(name = "boost_activated_at")
    private LocalDateTime boostActivatedAt;
}