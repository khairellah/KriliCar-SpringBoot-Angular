package com.kriliCar.dtos;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientProfileRequest {
    private String firstName;
    private String lastName;
    private String phone;
    // Volontairement absents : email, role (non modifiables - règle commune §2)
    // password retiré : géré exclusivement par changePassword() (cf. ChangePasswordRequest)
}