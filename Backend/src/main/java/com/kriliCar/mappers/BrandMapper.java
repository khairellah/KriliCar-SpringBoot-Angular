package com.kriliCar.mappers;

import com.kriliCar.dtos.BrandDTO;
import com.kriliCar.entities.Brand;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface BrandMapper {

    BrandDTO toDTO(Brand brand);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true) // généré par @PrePersist (BaseEntity)
    Brand toEntity(BrandDTO brandDTO);
}