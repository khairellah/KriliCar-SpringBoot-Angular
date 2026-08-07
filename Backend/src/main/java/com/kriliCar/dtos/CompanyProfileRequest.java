package com.kriliCar.dtos;

import com.kriliCar.enums.City;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyProfileRequest {
    private String firstName;
    private String lastName;
    private String phone;
    private String companyName;
    private String landline;
    private City city;
    private String description;
}
