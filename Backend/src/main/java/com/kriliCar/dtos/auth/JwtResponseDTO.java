package com.kriliCar.dtos.auth;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JwtResponseDTO {
    private String token;
    private String email;
    private String role;
    private String code;
}