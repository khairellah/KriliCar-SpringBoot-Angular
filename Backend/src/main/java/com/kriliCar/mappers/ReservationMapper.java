package com.kriliCar.mappers;

import com.kriliCar.dtos.ReservationDTO;
import com.kriliCar.entities.Reservation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", uses = {CarMapper.class})
public interface ReservationMapper {

    @Mapping(target = "carCode", source = "car.code")
    @Mapping(target = "car", source = "car")
    @Mapping(target = "client", source = "client")
    ReservationDTO toDTO(Reservation reservation);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "car", ignore = true)
    @Mapping(target = "client", ignore = true)
    @Mapping(target = "status", ignore = true)
    Reservation toEntity(ReservationDTO dto);

    List<ReservationDTO> toDTOList(List<Reservation> reservations);
}