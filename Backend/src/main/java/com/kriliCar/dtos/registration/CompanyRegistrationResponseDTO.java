package com.kriliCar.dtos.registration;


import com.kriliCar.enums.City;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CompanyRegistrationResponseDTO {

    // CHAMPS HÉRITÉS (Communs à AppUser)
    private String code; // Nouveau champ
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String image;

    // CHAMPS SPÉCIFIQUES À COMPANY
    private String landline;
    private City city;
    private String description;
    private Boolean isBooster = false;
}