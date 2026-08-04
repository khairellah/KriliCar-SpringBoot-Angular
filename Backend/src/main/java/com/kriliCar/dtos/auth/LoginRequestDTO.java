package com.kriliCar.dtos.auth;

import lombok.Data;

@Data
public class LoginRequestDTO {
    private String email;
    private String password;
}