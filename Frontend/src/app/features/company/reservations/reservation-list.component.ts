import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReservationService } from '../../client/services/reservation.service';
import { ReservationDTO } from '../../../core/models/reservation/reservation.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { ReservationStatus } from '../../../core/models/enums';
import { RESERVATION_STATUS_DESCRIPTIONS } from '../../../core/utils/reservation-status.util';

import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { PendingReservationsBadgeComponent } from '../../../shared/components/pending-reservations-badge/pending-reservations-badge.component';


/** 🔧 US-5.5 : le targetStatus 'CONFIRMED' n'est plus utilisé (Confirmer reste direct,
 * sans confirmation inline) ; on ajoute 'COMPLETED' qui suit le même pattern
 * de confirmation inline que 'CANCELLED'. */
interface PendingAction {
  code: string;
  targetStatus: 'CANCELLED' | 'COMPLETED';
}

@Component({
  selector: 'app-company-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    PendingReservationsBadgeComponent
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

  readonly statusDescriptions = RESERVATION_STATUS_DESCRIPTIONS;

  readonly pendingAction = signal<PendingAction | null>(null);
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

  statusDescription(status: ReservationStatus): string {
    return this.statusDescriptions[status];
  }

  canConfirm(status: ReservationStatus): boolean {
    return status === 'PENDING';
  }

  canCancel(status: ReservationStatus): boolean {
    return status === 'PENDING' || status === 'CONFIRMED';
  }

  /** 🔧 US-5.5 : seul point d'entrée qui repasse aussi la voiture à AVAILABLE côté backend. */
  canComplete(status: ReservationStatus): boolean {
    return status === 'CONFIRMED';
  }

  confirmReservation(code: string): void {
    this.applyStatusChange(code, 'CONFIRMED');
  }

  askCancel(code: string): void {
    this.actionErrorMessage.set(null);
    this.pendingAction.set({ code, targetStatus: 'CANCELLED' });
  }

  // 🔧 US-5.5
  askComplete(code: string): void {
    this.actionErrorMessage.set(null);
    this.pendingAction.set({ code, targetStatus: 'COMPLETED' });
  }

  cancelPendingAction(): void {
    this.pendingAction.set(null);
  }

  confirmPendingAction(code: string): void {
    const action = this.pendingAction();
    if (!action || action.code !== code) {
      return;
    }
    this.applyStatusChange(code, action.targetStatus);
  }

  isPendingAction(code: string): boolean {
    return this.pendingAction()?.code === code;
  }

  pendingActionLabel(code: string): string {
    const action = this.pendingAction();
    if (!action || action.code !== code) {
      return '';
    }
    return action.targetStatus === 'CANCELLED'
      ? "Confirmer l'annulation ?"
      : 'Confirmer que le véhicule a été rendu ?';
  }

  private applyStatusChange(
    code: string,
    targetStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  ): void {
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