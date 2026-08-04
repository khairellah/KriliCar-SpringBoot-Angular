package com.kriliCar.dtos.registration;

import com.kriliCar.enums.City;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CompanyRegistrationDTO {

    // CHAMPS HÉRITÉS (Communs à AppUser)
    private String firstName;
    private String lastName;
    private String email;
    private String password;
    private String phone;
    private String image;

    // CHAMPS SPÉCIFIQUES À COMPANY
    private String companyName;
    private String landline;
    private City city;
    private String description;

    // ⚠️ SÉCURITÉ (US-1.3 / §9.3 spec) :
    // Le champ isBooster a été retiré de ce DTO d'entrée.
    // Le statut Boost ne peut JAMAIS être positionné par le client à l'inscription.
    // Il est géré exclusivement par le flux Admin (US-6.1 / US-6.2).
}