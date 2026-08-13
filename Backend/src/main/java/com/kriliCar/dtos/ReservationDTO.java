package com.kriliCar.dtos;

import com.kriliCar.enums.ReservationStatus;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationDTO {

    private String code;
    private LocalDate startDate;
    private LocalDate endDate;
    private Double totalPrice;
    private ReservationStatus status;
    private LocalDateTime createdAt;

    private String carCode;

    private CarDTO car;
    private ClientDisplayDTO client;
}