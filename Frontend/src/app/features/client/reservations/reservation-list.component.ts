import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip'; // 🆕 US-5.5

import { ReservationService } from '../services/reservation.service';
import { ReservationDTO } from '../../../core/models/reservation/reservation.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { ReservationStatus } from '../../../core/models/enums';
import { RESERVATION_STATUS_DESCRIPTIONS } from '../../../core/utils/reservation-status.util'; // 🆕 US-5.5

import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-client-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule, // 🆕 US-5.5
    RouterLink,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './reservation-list.component.html',
  styleUrl: './reservation-list.component.scss'
})
export class ClientReservationListComponent {
  private readonly reservationService = inject(ReservationService);

  readonly reservations = signal<ReservationDTO[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly statusLabels: Record<ReservationStatus, string> = {
    PENDING: 'En attente de confirmation',
    CONFIRMED: 'Confirmée',
    CANCELLED: 'Annulée',
    COMPLETED: 'Terminée'
  };

  // 🆕 US-5.5 : description au survol du badge (affichage lecture seule du cycle de vie)
  readonly statusDescriptions = RESERVATION_STATUS_DESCRIPTIONS;

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
          body?.message ?? 'Impossible de charger vos réservations. Veuillez réessayer plus tard.'
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

  // 🆕 Fix US-5.5
  statusDescription(status: ReservationStatus): string {
    return this.statusDescriptions[status];
  }
}