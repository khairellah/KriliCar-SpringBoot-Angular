package com.kriliCar.services.impl;

import com.kriliCar.dtos.ReservationDTO;
import com.kriliCar.entities.*;
import com.kriliCar.enums.CarAvailability;
import com.kriliCar.enums.ReservationStatus;
import com.kriliCar.enums.Role;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.exceptions.UnauthorizedActionException;
import com.kriliCar.mappers.ReservationMapper;
import com.kriliCar.repositories.*;
import com.kriliCar.services.interfaces.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;

@Service("reservationServiceImpl")
@RequiredArgsConstructor
@Transactional
public class ReservationServiceImpl implements ReservationService {

    private final ReservationRepository reservationRepository;
    private final AppUserRepository appUserRepository;
    private final CarRepository carRepository;
    private final CompanyRepository companyRepository; // requis pour US-5.7
    private final ReservationMapper mapper;

    // ============================================================
    // US-5.1 : Création réservation par Client
    // ============================================================
    @Override
    public ReservationDTO createReservation(ReservationDTO dto, String userEmail) throws Exception {
        if (dto.getStartDate().isBefore(LocalDate.now()) || dto.getEndDate().isBefore(dto.getStartDate())) {
            throw new IllegalArgumentException("Dates de réservation invalides.");
        }

        Car car = carRepository.findByCode(dto.getCarCode())
                .orElseThrow(() -> new ResourceNotFoundException("Car", "code", dto.getCarCode()));

        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        if (car.getAvailability() != CarAvailability.AVAILABLE) {
            throw new IllegalStateException("Le véhicule n'est pas disponible pour une nouvelle réservation.");
        }

        if (!reservationRepository.findConflictingReservations(car.getId(), dto.getStartDate(), dto.getEndDate()).isEmpty()) {
            throw new IllegalStateException("Le véhicule est déjà réservé sur cette période.");
        }

        Reservation reservation = mapper.toEntity(dto);
        reservation.setClient((Client) user);
        reservation.setCar(car);
        reservation.setTotalPrice(calculatePrice(car, dto.getStartDate(), dto.getEndDate()));
        reservation.setStatus(ReservationStatus.PENDING); // US-5.7 : déclenche la notification Company

        return mapper.toDTO(reservationRepository.save(reservation));
    }

    // ============================================================
    // US-5.2 : Consulter ma liste (Client ou Company)
    // ============================================================
    @Override
    @Transactional(readOnly = true)
    public List<ReservationDTO> getMyReservations(String userEmail) {
        AppUser user = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        List<Reservation> reservations;
        if (user.getRole() == Role.CLIENT) {
            reservations = reservationRepository.findByClient((Client) user);
        } else if (user.getRole() == Role.COMPANY) {
            reservations = reservationRepository.findByCarCompany((Company) user);
        } else {
            return Collections.emptyList();
        }
        return mapper.toDTOList(reservations);
    }

    // ============================================================
    // US-5.3, 5.4, 5.5 : Confirmation / Annulation (Company) / Fin + état voiture
    // ============================================================
    @Override
    public ReservationDTO updateReservationStatus(String code, ReservationStatus newStatus) throws ResourceNotFoundException {
        Reservation reservation = reservationRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "code", code));

        Car car = reservation.getCar();

        // US-5.4 : Changement auto état voiture (RESERVED) si confirmé
        if (newStatus == ReservationStatus.CONFIRMED) {
            car.setAvailability(CarAvailability.RESERVED);
        }
        // US-5.5 : Fin réservation (COMPLETED) ou Annulation (CANCELLED) -> AVAILABLE
        else if (newStatus == ReservationStatus.CANCELLED || newStatus == ReservationStatus.COMPLETED) {
            car.setAvailability(CarAvailability.AVAILABLE);
        }

        reservation.setStatus(newStatus);
        carRepository.save(car);
        return mapper.toDTO(reservationRepository.save(reservation));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationDTO> getAllReservations() {
        return mapper.toDTOList(reservationRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationDTO getByCode(String code) throws ResourceNotFoundException {
        return mapper.toDTO(reservationRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "code", code)));
    }

    @Override
    public void deleteByCode(String code) throws ResourceNotFoundException {
        Reservation reservation = reservationRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "code", code));
        if (reservation.getStatus() == ReservationStatus.CONFIRMED) {
            throw new IllegalStateException("Impossible de supprimer une réservation confirmée. Veuillez l'annuler.");
        }
        reservationRepository.delete(reservation);
    }

    private Double calculatePrice(Car car, LocalDate start, LocalDate end) {
        // 🔧 CORRECTION : convention INCLUSIVE — le jour de début ET le jour de fin
        // comptent chacun comme un jour facturé.
        // Exemple : 2026-09-01 → 2026-09-05 = 5 jours facturés (au lieu de 4 en exclusif).
        long days = ChronoUnit.DAYS.between(start, end) + 1;
        return car.getPrice() * days;
    }

    // ============================================================
    // Sécurité pour @PreAuthorize
    // ============================================================
    @Override
    @Transactional(readOnly = true)
    public boolean isReservationOwnedByClient(String code, String email) {
        return reservationRepository.findByCode(code)
                .map(r -> r.getClient().getEmail().equals(email))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isCarOfReservationOwnedByCompany(String code, String email) {
        return reservationRepository.findByCode(code)
                .map(r -> r.getCar().getCompany().getEmail().equals(email))
                .orElse(false);
    }

    // ============================================================
    // US-5.6 : Annulation par le Client — UNIQUEMENT si PENDING
    // ============================================================
    @Override
    public ReservationDTO cancelReservationByClient(String code, String clientEmail) throws ResourceNotFoundException {
        Reservation reservation = reservationRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", "code", code));

        // Double vérification de propriété (en plus du @PreAuthorize côté controller)
        if (!reservation.getClient().getEmail().equals(clientEmail)) {
            throw new UnauthorizedActionException("Vous n'êtes pas autorisé à annuler cette réservation.");
        }

        // Règle métier stricte (spec §6.4) : seul le statut PENDING est annulable par le client.
        // Au-delà (CONFIRMED), l'annulation redevient une action de la Company (US-5.3),
        // afin d'éviter les annulations client sans contact préalable.
        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new IllegalStateException(
                    "Seule une réservation en attente (PENDING) peut être annulée par le client. Statut actuel : "
                            + reservation.getStatus());
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        // Pas de changement d'état voiture ici : une réservation PENDING n'a jamais fait
        // passer la voiture à RESERVED (cela n'arrive qu'à la CONFIRMATION, cf. US-5.4).

        return mapper.toDTO(reservationRepository.save(reservation));
    }

    // ============================================================
    // US-5.7 : Comptage des réservations PENDING pour la Company (notification)
    // ============================================================
    @Override
    @Transactional(readOnly = true)
    public long countPendingReservationsForCompany(String companyEmail) throws ResourceNotFoundException {
        Company company = companyRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "email", companyEmail));

        return reservationRepository.countByCarCompanyAndStatus(company, ReservationStatus.PENDING);
    }
}