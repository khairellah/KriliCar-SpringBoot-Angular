package com.kriliCar.dtos.registration;

import com.kriliCar.enums.City;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CompanyRegistrationDTO {

    // CHAMPS HÉRITÉS (Communs à AppUser)
    @NotBlank(message = "Le prénom est obligatoire")
    private String firstName;

    @NotBlank(message = "Le nom est obligatoire")
    private String lastName;

    @NotBlank(message = "L'email est obligatoire")
    @Email(message = "Format d'email invalide")
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Size(min = 6, message = "Le mot de passe doit contenir au moins 6 caractères")
    private String password;

    @NotBlank(message = "Le téléphone est obligatoire")
    @Pattern(regexp = "^[0-9+ ]{8,15}$", message = "Format de téléphone invalide")
    private String phone;

    private String image; // optionnel, géré par le fichier uploadé

    // CHAMPS SPÉCIFIQUES À COMPANY
    @NotBlank(message = "Le nom de la société est obligatoire")
    private String companyName;

    private String landline; // téléphone fixe, facultatif

    @NotNull(message = "La ville est obligatoire")
    private City city;

    @Size(max = 1000, message = "La description ne doit pas dépasser 1000 caractères")
    private String description;

    // ⚠️ SÉCURITÉ (US-1.3 / §9.3 spec) :
    // Le champ isBooster a été retiré de ce DTO d'entrée.
    // Le statut Boost ne peut JAMAIS être positionné par le client à l'inscription.
    // Il est géré exclusivement par le flux Admin (US-6.1 / US-6.2).
}