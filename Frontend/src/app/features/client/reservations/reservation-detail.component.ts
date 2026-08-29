import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/auth/auth.service';
import { ReservationService } from '../services/reservation.service';
import { ReservationDTO } from '../../../core/models/reservation/reservation.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { ReservationStatus } from '../../../core/models/enums';
import {
  RESERVATION_STATUS_DESCRIPTIONS,
  isTerminalReservationStatus
} from '../../../core/utils/reservation-status.util';

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

  readonly statusDescriptions = RESERVATION_STATUS_DESCRIPTIONS;

  readonly backLink = computed(() =>
    this.role() === 'COMPANY' ? '/company/reservations' : '/client/reservations'
  );

  readonly isCompany = computed(() => this.role() === 'COMPANY');

  // 🆕 US-5.6
  readonly isClient = computed(() => this.role() === 'CLIENT');

  readonly canConfirm = computed(() => this.reservation()?.status === 'PENDING');

  /** Annulation côté Company (US-5.4, via PATCH /status) : autorisée sur PENDING et CONFIRMED. */
  readonly canCancel = computed(() => {
    const status = this.reservation()?.status;
    return status === 'PENDING' || status === 'CONFIRMED';
  });

  /**
   * 🆕 US-5.6 : Annulation côté Client (via PATCH /cancel) : autorisée
   * UNIQUEMENT sur PENDING — règle stricte distincte de canCancel (Company),
   * conformément à §6.4 Spec Globale et §4.2 Spec Frontend.
   */
  readonly canClientCancel = computed(
    () => this.isClient() && this.reservation()?.status === 'PENDING'
  );

  readonly canComplete = computed(() => this.reservation()?.status === 'CONFIRMED');

  readonly isTerminal = computed(() => {
    const status = this.reservation()?.status;
    return status ? isTerminalReservationStatus(status) : false;
  });

  readonly askingCancel = signal(false);
  readonly askingComplete = signal(false);
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

  confirmReservation(): void {
    this.applyStatusChange('CONFIRMED');
  }

  askCancel(): void {
    this.actionErrorMessage.set(null);
    this.askingCancel.set(true);
  }

  cancelAskCancel(): void {
    this.askingCancel.set(false);
  }

  /**
   * 🔧 US-5.6 : point d'entrée unique du bouton "Oui, annuler" dans le
   * dialogue de confirmation inline, partagé par les deux rôles. Il route
   * vers le bon appel API selon qui est connecté : le Client utilise
   * l'endpoint dédié /cancel (règle stricte PENDING uniquement), la Company
   * continue d'utiliser /status comme avant (US-5.4, inchangé).
   */
  confirmCancelReservation(): void {
    if (this.isClient()) {
      this.performClientCancel();
      return;
    }
    this.applyStatusChange('CANCELLED');
  }

  askComplete(): void {
    this.actionErrorMessage.set(null);
    this.askingComplete.set(true);
  }

  cancelAskComplete(): void {
    this.askingComplete.set(false);
  }

  confirmCompleteReservation(): void {
    this.applyStatusChange('COMPLETED');
  }

  /** 🆕 US-5.6 : appel dédié PATCH /reservations/{code}/cancel (Client, PENDING uniquement). */
  private performClientCancel(): void {
    this.actionErrorMessage.set(null);
    this.isUpdatingStatus.set(true);

    this.reservationService.cancelReservation(this.code).subscribe({
      next: (updated) => {
        this.isUpdatingStatus.set(false);
        this.askingCancel.set(false);
        this.reservation.set(updated);
      },
      error: (err: HttpErrorResponse) => {
        this.isUpdatingStatus.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.actionErrorMessage.set(
          body?.message ?? "Impossible d'annuler cette réservation. Veuillez réessayer plus tard."
        );
      }
    });
  }

  /** Utilisé par la Company (US-5.4/5.5) : PATCH /reservations/{code}/status. */
  private applyStatusChange(targetStatus: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'): void {
    this.actionErrorMessage.set(null);
    this.isUpdatingStatus.set(true);

    this.reservationService.updateStatus(this.code, targetStatus).subscribe({
      next: (updated) => {
        this.isUpdatingStatus.set(false);
        this.askingCancel.set(false);
        this.askingComplete.set(false);
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