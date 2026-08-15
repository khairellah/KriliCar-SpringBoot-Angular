package com.kriliCar.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * US-8.1 : DTO agrégé des KPI globaux de la plateforme, destiné à l'Admin.
 * Structure imbriquée par domaine pour rester lisible côté frontend (§4.6 spec).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminKpiDTO {

    private CompanyKpi companies;
    private ClientKpi clients;
    private ReservationKpi reservations;
    private long wishlistTotalCount;
    private CarKpi cars;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyKpi {
        private long activeCount;
        private long inactiveCount;
        private long boostedCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClientKpi {
        private long activeCount;
        private long inactiveCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReservationKpi {
        private long okCount;      // CONFIRMED + COMPLETED
        private long koCount;      // CANCELLED
        private long pendingCount; // PENDING
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CarKpi {
        private long totalCount;
        private long availableCount;
        private long reservedCount;
        private long maintenanceCount;
    }
}