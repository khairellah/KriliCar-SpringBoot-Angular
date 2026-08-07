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
    // Optionnel : si renseigné, le mot de passe est haché et mis à jour.
    private String password;
    // Volontairement absent : email, role -> non modifiables (US-1.5 / règle commune §2)
}