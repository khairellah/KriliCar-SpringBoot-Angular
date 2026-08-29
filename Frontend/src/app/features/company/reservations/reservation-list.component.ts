import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Import cross-feature volontaire : même service que côté Client, l'endpoint
// GET /reservations/my est commun aux deux rôles (résolution du scope côté
// backend via le token). Pattern déjà établi dans ce projet (ex: CarService
// réutilisé côté Client dans ReservationFormComponent pour US-5.1).
import { ReservationService } from '../../client/services/reservation.service';
import { ReservationDTO } from '../../../core/models/reservation/reservation.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { ReservationStatus } from '../../../core/models/enums';

import { RouterLink } from '@angular/router'; // 🆕 US-5.3
import { MatIconModule } from '@angular/material/icon'; // 🆕 US-5.3
import { MatButtonModule } from '@angular/material/button'; // 🆕 US-5.4 (manquait déjà pour le bouton "voir détail")

/** US-5.4 : action envisagée sur une ligne, en attente de confirmation inline. */
interface PendingAction {
  code: string;
  targetStatus: 'CONFIRMED' | 'CANCELLED';
}

/**
 * US-5.2 : Consultation des réservations reçues par la Company connectée
 * (lecture seule). GET /api/v1/reservations/my.
 *
 * US-5.4 : Confirmation/Annulation d'une réservation par la Company, avec
 * répercussion automatique sur l'état de la voiture (gérée exclusivement
 * côté backend, cf. ReservationServiceImpl.updateReservationStatus).
 *
 * Hors périmètre volontaire de cette US : badge de notification PENDING
 * (US-5.7).
 */
@Component({
  selector: 'app-company-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    RouterLink,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './reservation-list.component.html',
  styleUrl: './reservation-list.component.scss'
})
export class CompanyReservationListComponent {
  private readonly reservationService = inject(ReservationService);

  readonly displayedColumns = ['car', 'client', 'dates', 'price', 'status', 'actions'] as const;

  readonly reservations = signal<ReservationDTO[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly statusLabels: Record<ReservationStatus, string> = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmée',
    CANCELLED: 'Annulée',
    COMPLETED: 'Terminée'
  };

  // ============================ US-5.4 : Confirmation / Annulation ============================
  /** Ligne pour laquelle une confirmation inline "Annuler" est affichée. */
  readonly pendingAction = signal<PendingAction | null>(null);
  /** Code de la réservation en cours de mise à jour (désactive ses boutons). */
  readonly updatingCode = signal<string | null>(null);
  readonly actionErrorMessage = signal<string | null>(null);

  constructor() {
    this.loadReservations();
  }

  private loadReservations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        this.reservations.set(
          [...reservations].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.errorMessage.set(
          body?.message ?? 'Impossible de charger les réservations reçues. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  statusClass(status: ReservationStatus): string {
    return 'status-' + status.toLowerCase();
  }

  statusLabel(status: ReservationStatus): string {
    return this.statusLabels[status];
  }

  // ============================ US-5.4 : règles d'affichage (§8 Spec Frontend) ============================

  /** PENDING → [Company] Confirmer → CONFIRMED */
  canConfirm(status: ReservationStatus): boolean {
    return status === 'PENDING';
  }

  /** PENDING/CONFIRMED → [Company] Annuler → CANCELLED */
  canCancel(status: ReservationStatus): boolean {
    return status === 'PENDING' || status === 'CONFIRMED';
  }

  // ============================ US-5.4 : Confirmer (action directe) ============================

  confirmReservation(code: string): void {
    this.applyStatusChange(code, 'CONFIRMED');
  }

  // ============================ US-5.4 : Annuler (confirmation inline requise) ============================

  askCancel(code: string): void {
    this.actionErrorMessage.set(null);
    this.pendingAction.set({ code, targetStatus: 'CANCELLED' });
  }

  cancelAskCancel(): void {
    this.pendingAction.set(null);
  }

  confirmCancelReservation(code: string): void {
    this.applyStatusChange(code, 'CANCELLED');
  }

  isPendingCancel(code: string): boolean {
    return this.pendingAction()?.code === code;
  }

  private applyStatusChange(code: string, targetStatus: 'CONFIRMED' | 'CANCELLED'): void {
    this.actionErrorMessage.set(null);
    this.updatingCode.set(code);

    this.reservationService.updateStatus(code, targetStatus).subscribe({
      next: (updated) => {
        this.updatingCode.set(null);
        this.pendingAction.set(null);
        this.reservations.update((list) =>
          list.map((r) => (r.code === updated.code ? updated : r))
        );
      },
      error: (err: HttpErrorResponse) => {
        this.updatingCode.set(null);
        const body = err.error as ErrorResponse | undefined;
        this.actionErrorMessage.set(
          body?.message ?? 'Impossible de mettre à jour cette réservation. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}