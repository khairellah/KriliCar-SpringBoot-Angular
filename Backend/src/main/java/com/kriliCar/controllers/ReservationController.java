package com.kriliCar.controllers;

import com.kriliCar.dtos.ReservationDTO;
import com.kriliCar.dtos.responses.PendingReservationCountDTO;
import com.kriliCar.enums.ReservationStatus;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.services.interfaces.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    // ============================================================
    // US-5.1 : Création réservation par Client
    // ============================================================
    @PostMapping
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<ReservationDTO> createReservation(
            @RequestBody ReservationDTO dto,
            Authentication auth
    ) throws Exception {
        ReservationDTO created = reservationService.createReservation(dto, auth.getName());
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // ============================================================
    // US-5.2 : Consulter mes réservations (Client / Company)
    // ============================================================
    @GetMapping("/my")
    @PreAuthorize("hasAnyAuthority('CLIENT', 'COMPANY')")
    public ResponseEntity<List<ReservationDTO>> getMyReservations(Authentication auth) {
        return ResponseEntity.ok(reservationService.getMyReservations(auth.getName()));
    }

    // ============================================================
    // US-5.3, 5.4, 5.5 : Confirmation / Annulation (Company) / Fin de réservation
    // Seul l'Admin ou la Company propriétaire du véhicule peut changer le statut
    // ============================================================
    @PatchMapping("/{code}/status")
    @PreAuthorize("hasAuthority('ADMIN') or @reservationServiceImpl.isCarOfReservationOwnedByCompany(#code, principal.username)")
    public ResponseEntity<ReservationDTO> updateStatus(
            @PathVariable String code,
            @RequestParam ReservationStatus status
    ) {
        return ResponseEntity.ok(reservationService.updateReservationStatus(code, status));
    }

    // ============================================================
    // US-5.6 : Annulation par le Client — uniquement si PENDING
    // ============================================================
    @PatchMapping("/{code}/cancel")
    @PreAuthorize("hasAuthority('CLIENT') and @reservationServiceImpl.isReservationOwnedByClient(#code, principal.username)")
    public ResponseEntity<ReservationDTO> cancelReservation(
            @PathVariable String code,
            Authentication auth
    ) throws ResourceNotFoundException {
        return ResponseEntity.ok(reservationService.cancelReservationByClient(code, auth.getName()));
    }

    // ============================================================
    // US-5.7 : Compteur de notifications (réservations PENDING) — Company
    // ============================================================
    @GetMapping("/company/pending-count")
    @PreAuthorize("hasAuthority('COMPANY')")
    public ResponseEntity<PendingReservationCountDTO> getPendingCountForCompany(Authentication auth) {
        long count = reservationService.countPendingReservationsForCompany(auth.getName());
        return ResponseEntity.ok(PendingReservationCountDTO.builder()
                .pendingCount(count)
                .build());
    }

    // ============================================================
    // US-5.3 : Consulter une réservation spécifique par son code
    // ============================================================
    @GetMapping("/{code}")
    @PreAuthorize("hasAuthority('ADMIN') or " +
            "@reservationServiceImpl.isReservationOwnedByClient(#code, principal.username) or " +
            "@reservationServiceImpl.isCarOfReservationOwnedByCompany(#code, principal.username)")
    public ResponseEntity<ReservationDTO> getByCode(@PathVariable String code) {
        return ResponseEntity.ok(reservationService.getByCode(code));
    }

    // ============================================================
    // Suppression d'une réservation (uniquement si elle n'est pas CONFIRMED)
    // ============================================================
    @DeleteMapping("/{code}")
    @PreAuthorize("hasAuthority('ADMIN') or @reservationServiceImpl.isReservationOwnedByClient(#code, principal.username)")
    public ResponseEntity<Void> deleteReservation(@PathVariable String code) {
        reservationService.deleteByCode(code);
        return ResponseEntity.noContent().build();
    }

    // ============================================================
    // Admin voit tout
    // ============================================================
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<ReservationDTO>> getAllReservations() {
        return ResponseEntity.ok(reservationService.getAllReservations());
    }
}