package com.kriliCar.dtos;

import com.kriliCar.enums.Role;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
// NOTE: N'inclut pas @Builder car nous mappons directement depuis l'entité.
public class UserDisplayDTO {
    private String code;
    private String firstName;
    private String lastName;
    private String phone;
    private String email;
    private String image;
    private Role role;
}