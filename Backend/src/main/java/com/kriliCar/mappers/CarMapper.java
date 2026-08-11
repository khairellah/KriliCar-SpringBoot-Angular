package com.kriliCar.mappers;

import com.kriliCar.dtos.CarDTO;
import com.kriliCar.entities.Car;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
@Mapper(componentModel = "spring", uses = {CarImageMapper.class})
public interface CarMapper {

    @Mapping(source = "brand.code", target = "brandCode")
    @Mapping(source = "brand.name", target = "brandName")
    @Mapping(source = "model.code", target = "modelCode")
    @Mapping(source = "model.name", target = "modelName")
    @Mapping(source = "company.code", target = "companyCode")
    CarDTO toDTO(Car car);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "code", ignore = true)
    @Mapping(target = "brand", ignore = true)
    @Mapping(target = "model", ignore = true)
    @Mapping(target = "company", ignore = true)
    @Mapping(target = "images", ignore = true)
    Car toEntity(CarDTO carDTO);
}