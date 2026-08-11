package com.kriliCar.mappers;

import com.kriliCar.dtos.responses.CarImageDTO;
import com.kriliCar.entities.CarImage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface CarImageMapper {
    // "code" est mappé automatiquement (champ hérité de BaseEntity, présent
    // dans l'entité ET dans le DTO sous le même nom)
    CarImageDTO toDTO(CarImage carImage);

    @Mapping(target = "car", ignore = true)
    // Le code est généré par @PrePersist (BaseEntity) : on ne doit jamais
    // laisser un client en imposer un via le DTO
    @Mapping(target = "code", ignore = true)
    CarImage toEntity(CarImageDTO carImageDTO);
}