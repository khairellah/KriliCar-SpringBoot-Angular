package com.kriliCar.dtos.responses;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ClientStatsDTO {
    private long totalReservations;
    private long pendingReservations;
    private long confirmedReservations;
    private long cancelledReservations;
    private long completedReservations;
    private long wishlistCount;
}