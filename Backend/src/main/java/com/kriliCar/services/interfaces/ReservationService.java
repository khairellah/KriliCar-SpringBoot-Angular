package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.ReservationDTO;
import com.kriliCar.enums.ReservationStatus;
import com.kriliCar.exceptions.ResourceNotFoundException;
import java.util.List;

public interface ReservationService {

    // US-5.1 : Création réservation par Client
    ReservationDTO createReservation(ReservationDTO reservationDTO, String userEmail) throws Exception;

    // US-5.2 : Consultation (Ma liste / Toutes)
    List<ReservationDTO> getMyReservations(String userEmail);
    List<ReservationDTO> getAllReservations();
    ReservationDTO getByCode(String code) throws ResourceNotFoundException;

    // US-5.3, 5.4, 5.5 : Confirmation, Annulation (Company) et Fin (Changement d'état voiture)
    ReservationDTO updateReservationStatus(String code, ReservationStatus newStatus) throws ResourceNotFoundException;

    void deleteByCode(String code) throws ResourceNotFoundException;

    // Méthodes de sécurité pour @PreAuthorize
    boolean isReservationOwnedByClient(String code, String email);
    boolean isCarOfReservationOwnedByCompany(String code, String email);

    // US-5.6 : Annulation de la réservation par le Client (uniquement si PENDING)
    ReservationDTO cancelReservationByClient(String code, String clientEmail) throws ResourceNotFoundException;

    // US-5.7 : Nombre de réservations PENDING pour la Company connectée (notification)
    long countPendingReservationsForCompany(String companyEmail) throws ResourceNotFoundException;
}