package com.kriliCar.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * US-1.6 : Champs modifiables du profil Admin.
 * Volontairement absents : email, role (non modifiables) et password
 * (géré séparément via /profile/change-password + ChangePasswordRequest).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminProfileRequest {
    private String firstName;
    private String lastName;
    private String phone;
}