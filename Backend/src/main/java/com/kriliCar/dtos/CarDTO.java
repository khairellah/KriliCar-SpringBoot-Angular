package com.kriliCar.dtos;

import com.kriliCar.dtos.responses.CarImageDTO;
import com.kriliCar.enums.CarAvailability;
import com.kriliCar.enums.CarColor;
import com.kriliCar.enums.FuelType;
import com.kriliCar.enums.Gearbox;
import com.kriliCar.validation.ValidationGroups;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CarDTO {
    // ❌ id supprimé : jamais exposé côté client, le code métier suffit    private String code;
    private String code;

    // Obligatoire uniquement à la création ; le format reste vérifié si fourni à l'update
    @NotBlank(message = "Le VIN est obligatoire", groups = ValidationGroups.OnCreate.class)
    @Size(min = 17, max = 17, message = "Le VIN doit contenir exactement 17 caractères")
    private String vin;

    @NotNull(message = "L'année est obligatoire", groups = ValidationGroups.OnCreate.class)
    @Min(value = 1980, message = "L'année doit être supérieure ou égale à 1980")
    private Integer year;

    @PositiveOrZero(message = "Le kilométrage doit être positif ou nul")
    private Integer mileage;

    private Gearbox gearbox;
    private FuelType fuelType;
    private CarColor color;

    @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères")
    private String description;

    @Positive(message = "Le nombre de places doit être positif")
    @Max(value = 9, message = "Le nombre de places ne peut pas dépasser 9")
    private Integer nbrSeats;

    @Positive(message = "Le prix doit être strictement positif")
    private Double price;

    private CarAvailability availability;

    // Utilisation des codes métiers — obligatoires uniquement à la création
    @NotBlank(message = "Le code de la marque est obligatoire", groups = ValidationGroups.OnCreate.class)
    private String brandCode;

    @NotBlank(message = "Le code du modèle est obligatoire", groups = ValidationGroups.OnCreate.class)
    private String modelCode;

    private String brandName;
    private String modelName;
    // ❌ companyId (Long) supprimé — plus jamais d'ID technique exposé
    private String companyCode;

    private List<CarImageDTO> images;
}