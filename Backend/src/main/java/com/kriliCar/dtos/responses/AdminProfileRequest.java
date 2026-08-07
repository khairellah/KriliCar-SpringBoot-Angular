package com.kriliCar.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProfileRequest {

    // Champs modifiables (email et role exclus volontairement)
    private String firstName;
    private String lastName;
    private String phone;

    // Changement de mot de passe : optionnel, mais sécurisé
    private String currentPassword;
    private String newPassword;
}