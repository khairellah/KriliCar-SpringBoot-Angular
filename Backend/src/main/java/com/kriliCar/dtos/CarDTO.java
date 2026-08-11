package com.kriliCar.dtos;

import com.kriliCar.dtos.responses.CarImageDTO;
import com.kriliCar.enums.CarAvailability;
import com.kriliCar.enums.CarColor;
import com.kriliCar.enums.FuelType;
import com.kriliCar.enums.Gearbox;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CarDTO {
    // ❌ id supprimé : jamais exposé côté client, le code métier suffit    private String code;
    private String code;
    private String vin;
    private Integer year;
    private Integer mileage;
    private Gearbox gearbox;
    private FuelType fuelType;
    private CarColor color;
    private String description;
    private Integer nbrSeats;
    private Double price;
    private CarAvailability availability;

    // Utilisation des codes métiers
    private String brandCode;
    private String modelCode;

    private String brandName;
    private String modelName;
    // ❌ companyId (Long) supprimé — plus jamais d'ID technique exposé
    private String companyCode;

    private List<CarImageDTO> images;
}