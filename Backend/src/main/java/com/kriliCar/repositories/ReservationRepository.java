package com.kriliCar.repositories;

import com.kriliCar.entities.Client;
import com.kriliCar.entities.Company;
import com.kriliCar.entities.Reservation;
import com.kriliCar.enums.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    // 🔧 CORRECTION : logique de chevauchement adaptée à la convention INCLUSIVE
    // (startDate et endDate sont tous deux des jours d'occupation du véhicule).
    // Deux réservations sont en conflit si : newStart <= oldEnd ET newEnd >= oldStart
    @Query("SELECT r FROM Reservation r WHERE r.car.id = :carId " +
            "AND r.status IN (com.kriliCar.enums.ReservationStatus.PENDING, com.kriliCar.enums.ReservationStatus.CONFIRMED) " +
            "AND (r.startDate <= :endDate AND r.endDate >= :startDate)")
    List<Reservation> findConflictingReservations(
            @Param("carId") Long carId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Réservations d'un client (US-5.2)
    List<Reservation> findByClient(Client client);

    // Réservations de tout le parc d'une société (US-5.2)
    List<Reservation> findByCarCompany(Company company);

    // Recherche par code métier
    Optional<Reservation> findByCode(String code);

    // US-5.7 : Comptage des réservations PENDING pour une Company (badge de notification)
    long countByCarCompanyAndStatus(Company company, ReservationStatus status);

    // --- US-8.1 : KPI globaux Admin ---
    long countByStatus(ReservationStatus status);
    long countByStatusIn(List<ReservationStatus> statuses);

    // --- US-8.2 : KPI Company (total réservations du parc) ---
    long countByCarCompany(Company company);
}