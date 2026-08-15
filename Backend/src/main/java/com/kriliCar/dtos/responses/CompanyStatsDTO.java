package com.kriliCar.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CompanyStatsDTO {
    private long totalCars;
    private long availableCars;
    private long maintenanceCars;
    private long reservedCars;

    private long totalReservations;
    private long pendingReservations;
    private long confirmedReservations;
    private long cancelledReservations;
    private long completedReservations;
}