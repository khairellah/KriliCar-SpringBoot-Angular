package com.kriliCar.services.impl;

import com.kriliCar.dtos.responses.AdminKpiDTO;
import com.kriliCar.dtos.responses.CompanyKpiDTO;
import com.kriliCar.entities.Company;
import com.kriliCar.enums.CarAvailability;
import com.kriliCar.enums.ReservationStatus;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.repositories.CarRepository;
import com.kriliCar.repositories.CompanyRepository;
import com.kriliCar.repositories.ReservationRepository;
import com.kriliCar.services.interfaces.CompanyKpiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CompanyKpiServiceImpl implements CompanyKpiService {

    private final CompanyRepository companyRepository;
    private final CarRepository carRepository;
    private final ReservationRepository reservationRepository;

    @Override
    @Transactional(readOnly = true)
    public CompanyKpiDTO getMyKpi(String companyEmail) throws ResourceNotFoundException {

        // Résolution stricte via le token — jamais de companyCode transmis en paramètre libre
        Company company = companyRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "email", companyEmail));

        String companyCode = company.getCode();

        // --- Voitures (scopées à la Company) ---
        AdminKpiDTO.CarKpi carKpi = AdminKpiDTO.CarKpi.builder()
                .totalCount(carRepository.countByCompany_Code(companyCode))
                .availableCount(carRepository.countByCompany_CodeAndAvailability(companyCode, CarAvailability.AVAILABLE))
                .reservedCount(carRepository.countByCompany_CodeAndAvailability(companyCode, CarAvailability.RESERVED))
                .maintenanceCount(carRepository.countByCompany_CodeAndAvailability(companyCode, CarAvailability.MAINTENANCE))
                .build();

        // --- Réservations (scopées au parc de la Company) ---
        CompanyKpiDTO.ReservationKpi reservationKpi = CompanyKpiDTO.ReservationKpi.builder()
                .totalCount(reservationRepository.countByCarCompany(company))
                .validatedCount(reservationRepository.countByCarCompanyAndStatus(company, ReservationStatus.CONFIRMED))
                .cancelledCount(reservationRepository.countByCarCompanyAndStatus(company, ReservationStatus.CANCELLED))
                .build();

        return CompanyKpiDTO.builder()
                .cars(carKpi)
                .reservations(reservationKpi)
                .build();
    }
}