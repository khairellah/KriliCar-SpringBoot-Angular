package com.kriliCar.mappers;


import com.kriliCar.dtos.ModelDTO;
import com.kriliCar.entities.Model;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ModelMapper {

    @Mapping(source = "brand.code", target = "brandCode")
    @Mapping(source = "brand.name", target = "brandName")
    ModelDTO toDTO(Model model);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "brand", ignore = true) // Géré manuellement dans le Service
    Model toEntity(ModelDTO modelDTO);
}