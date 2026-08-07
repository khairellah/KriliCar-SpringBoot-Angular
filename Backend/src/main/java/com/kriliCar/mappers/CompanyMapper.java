package com.kriliCar.mappers;

import com.kriliCar.dtos.responses.CompanyProfileResponse;
import com.kriliCar.entities.Company;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper MapStruct pour la Company.
 * Convertit :
 * - Company (entité) → CompanyProfileResponse (DTO sécurisé)
 *
 * Le DTO ne contient PAS le password, le rôle, ou les timestamps sensibles.
 */
@Mapper(componentModel = "spring")
public interface CompanyMapper {

    /**
     * Convertit une entité Company en DTO de réponse de profil.
     * ✅ N'expose pas le password
     * ✅ Inclut le code métier et les timestamps utiles
     */
    //CompanyProfileResponse toProfileResponse(Company company);

    default CompanyProfileResponse toProfileResponse(Company company) {
        if (company == null) {
            return null;
        }

        return CompanyProfileResponse.builder()
                .code(company.getCode())
                .firstName(company.getFirstName())
                .lastName(company.getLastName())
                .email(company.getEmail())
                .phone(company.getPhone())
                .image(company.getImage())
                .companyName(company.getCompanyName())
                .landline(company.getLandline())
                .city(company.getCity())
                .description(company.getDescription())
                .isBooster(company.getIsBooster())
                .updatedAt(company.getUpdatedAt())
                .build();
    }


}
 