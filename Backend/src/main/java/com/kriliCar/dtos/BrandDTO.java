package com.kriliCar.dtos;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BrandDTO {
    private String code; // Identifiant métier, généré, jamais fourni en entrée

    @NotBlank(message = "Le nom de la marque est obligatoire")
    private String name;
}