package com.kriliCar.services.impl;

import com.kriliCar.dtos.responses.AdminKpiDTO;
import com.kriliCar.enums.CarAvailability;
import com.kriliCar.enums.ReservationStatus;
import com.kriliCar.repositories.*;
import com.kriliCar.services.interfaces.AdminKpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminKpiServiceImpl implements AdminKpiService {

    private final CompanyRepository companyRepository;
    private final ClientRepository clientRepository;
    private final ReservationRepository reservationRepository;
    private final CarRepository carRepository;
    private final WishlistRepository wishlistRepository;

    @Override
    @Transactional(readOnly = true)
    public AdminKpiDTO getGlobalKpi() {

        // --- Sociétés ---
        AdminKpiDTO.CompanyKpi companyKpi = AdminKpiDTO.CompanyKpi.builder()
                .activeCount(companyRepository.countByActive(true))
                .inactiveCount(companyRepository.countByActive(false))
                .boostedCount(companyRepository.countByIsBooster(true))
                .build();

        // --- Clients ---
        AdminKpiDTO.ClientKpi clientKpi = AdminKpiDTO.ClientKpi.builder()
                .activeCount(clientRepository.countByActive(true))
                .inactiveCount(clientRepository.countByActive(false))
                .build();

        // --- Réservations ---
        // OK = CONFIRMED + COMPLETED (§4.6 spec)
        long okCount = reservationRepository.countByStatusIn(
                List.of(ReservationStatus.CONFIRMED, ReservationStatus.COMPLETED));
        AdminKpiDTO.ReservationKpi reservationKpi = AdminKpiDTO.ReservationKpi.builder()
                .okCount(okCount)
                .koCount(reservationRepository.countByStatus(ReservationStatus.CANCELLED))
                .pendingCount(reservationRepository.countByStatus(ReservationStatus.PENDING))
                .build();

        // --- WishList (total brut) ---
        long wishlistTotal = wishlistRepository.count();

        // --- Voitures ---
        AdminKpiDTO.CarKpi carKpi = AdminKpiDTO.CarKpi.builder()
                .totalCount(carRepository.count())
                .availableCount(carRepository.countByAvailability(CarAvailability.AVAILABLE))
                .reservedCount(carRepository.countByAvailability(CarAvailability.RESERVED))
                .maintenanceCount(carRepository.countByAvailability(CarAvailability.MAINTENANCE))
                .build();

        return AdminKpiDTO.builder()
                .companies(companyKpi)
                .clients(clientKpi)
                .reservations(reservationKpi)
                .wishlistTotalCount(wishlistTotal)
                .cars(carKpi)
                .build();
    }
}