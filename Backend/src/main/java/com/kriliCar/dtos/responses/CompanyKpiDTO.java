package com.kriliCar.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * US-8.2 : DTO agrégé des KPI de la Company authentifiée (§5.5 spec).
 * Réutilise AdminKpiDTO.CarKpi (structure identique : total/available/reserved/maintenance)
 * pour éviter la duplication d'une classe strictement équivalente.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyKpiDTO {

    private AdminKpiDTO.CarKpi cars;
    private ReservationKpi reservations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservationKpi {
        private long totalCount;
        private long validatedCount; // CONFIRMED
        private long cancelledCount; // CANCELLED
    }
}