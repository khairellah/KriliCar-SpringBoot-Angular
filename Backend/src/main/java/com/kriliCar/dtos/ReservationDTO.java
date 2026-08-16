package com.kriliCar.dtos;

import com.kriliCar.enums.ReservationStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReservationDTO {

    private String code;

    @NotNull(message = "La date de début est obligatoire")
    @FutureOrPresent(message = "La date de début doit être aujourd'hui ou dans le futur")
    private LocalDate startDate;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDate endDate;

    private Double totalPrice;
    private ReservationStatus status;
    private LocalDateTime createdAt;

    @NotBlank(message = "Le code de la voiture est obligatoire")
    private String carCode;

    private CarDTO car;
    private ClientDisplayDTO client;
}