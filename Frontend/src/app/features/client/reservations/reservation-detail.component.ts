import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button'; // 🆕 US-5.4
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/auth/auth.service';
import { ReservationService } from '../services/reservation.service';
import { ReservationDTO } from '../../../core/models/reservation/reservation.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { ReservationStatus } from '../../../core/models/enums';

/**
 * US-5.3 : Détail d'une réservation par son code — GET /api/v1/reservations/{code}.
 *
 * Composant PARTAGÉ Client/Company : même endpoint, même DTO. L'autorisation
 * (Admin / Client propriétaire / Company propriétaire de la voiture) est
 * intégralement vérifiée côté backend via @PreAuthorize
 * (cf. ReservationController.getByCode).
 *
 * US-5.4 : ajoute les actions "Confirmer"/"Annuler", visibles uniquement
 * pour le rôle COMPANY et selon le statut courant (§8 Spec Frontend), avec
 * répercussion automatique sur l'état de la voiture gérée côté backend.
 *
 * Hors périmètre volontaire : annulation Client (US-5.6).
 */
@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reservation-detail.component.html',
  styleUrl: './reservation-detail.component.scss'
})
export class ReservationDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly reservationService = inject(ReservationService);
  private readonly authService = inject(AuthService);

  private readonly code = this.route.snapshot.paramMap.get('code')!;
  readonly role = this.authService.role;

  readonly reservation = signal<ReservationDTO | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly statusLabels: Record<ReservationStatus, string> = {
    PENDING: 'En attente de confirmation',
    CONFIRMED: 'Confirmée',
    CANCELLED: 'Annulée',
    COMPLETED: 'Terminée'
  };

  /** Lien de retour vers la liste, adapté au rôle connecté. */
  readonly backLink = computed(() =>
    this.role() === 'COMPANY' ? '/company/reservations' : '/client/reservations'
  );

  // ============================ US-5.4 : Confirmation / Annulation (Company) ============================
  readonly isCompany = computed(() => this.role() === 'COMPANY');

  readonly canConfirm = computed(() => this.reservation()?.status === 'PENDING');
  readonly canCancel = computed(() => {
    const status = this.reservation()?.status;
    return status === 'PENDING' || status === 'CONFIRMED';
  });

  readonly askingCancel = signal(false);
  readonly isUpdatingStatus = signal(false);
  readonly actionErrorMessage = signal<string | null>(null);

  constructor() {
    this.loadReservation();
  }

  private loadReservation(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reservationService.getByCode(this.code).subscribe({
      next: (reservation) => {
        this.reservation.set(reservation);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.resolveErrorMessage(err));
      }
    });
  }

  statusClass(status: ReservationStatus): string {
    return 'status-' + status.toLowerCase();
  }

  statusLabel(status: ReservationStatus): string {
    return this.statusLabels[status];
  }

  // ============================ US-5.4 : Confirmer (action directe) ============================

  confirmReservation(): void {
    this.applyStatusChange('CONFIRMED');
  }

  // ============================ US-5.4 : Annuler (confirmation inline requise) ============================

  askCancel(): void {
    this.actionErrorMessage.set(null);
    this.askingCancel.set(true);
  }

  cancelAskCancel(): void {
    this.askingCancel.set(false);
  }

  confirmCancelReservation(): void {
    this.applyStatusChange('CANCELLED');
  }

  private applyStatusChange(targetStatus: 'CONFIRMED' | 'CANCELLED'): void {
    this.actionErrorMessage.set(null);
    this.isUpdatingStatus.set(true);

    this.reservationService.updateStatus(this.code, targetStatus).subscribe({
      next: (updated) => {
        this.isUpdatingStatus.set(false);
        this.askingCancel.set(false);
        this.reservation.set(updated);
      },
      error: (err: HttpErrorResponse) => {
        this.isUpdatingStatus.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.actionErrorMessage.set(
          body?.message ?? 'Impossible de mettre à jour cette réservation. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  private resolveErrorMessage(err: HttpErrorResponse): string {
    const body = err.error as ErrorResponse | undefined;

    if (err.status === 404) {
      return body?.message ?? 'Cette réservation est introuvable.';
    }
    if (err.status === 403) {
      return body?.message ?? "Vous n'avez pas accès à cette réservation.";
    }
    return body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.';
  }
}