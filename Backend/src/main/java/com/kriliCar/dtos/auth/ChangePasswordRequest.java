package com.kriliCar.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour le changement de mot de passe.
 * Pattern classique : vérification de l'ancien mot de passe avant modification.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {

    @NotBlank(message = "L'ancien mot de passe est requis.")
    private String oldPassword;

    @NotBlank(message = "Le nouveau mot de passe est requis.")
    @Size(min = 6, max = 128, message = "Le mot de passe doit contenir entre 6 et 128 caractères.")
    private String newPassword;

    @NotBlank(message = "La confirmation du mot de passe est requise.")
    private String confirmPassword;
}