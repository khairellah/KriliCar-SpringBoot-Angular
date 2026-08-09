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
public class ModelDTO {

    private String code; // Code du modèle (généré, ignoré en entrée)

    @NotBlank(message = "Le nom du modèle est obligatoire")
    private String name;

    @NotBlank(message = "Le code de la marque associée est obligatoire")
    private String brandCode;

    private String brandName; // Pour l'affichage Front-end (lecture seule)
}