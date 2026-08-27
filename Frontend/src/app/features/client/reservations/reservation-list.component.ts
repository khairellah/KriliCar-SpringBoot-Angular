import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReservationService } from '../services/reservation.service';
import { ReservationDTO } from '../../../core/models/reservation/reservation.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { ReservationStatus } from '../../../core/models/enums';

import { RouterLink } from '@angular/router'; // 🆕 US-5.3
import { MatButtonModule } from '@angular/material/button'; // 🆕 US-5.3
import { MatIconModule } from '@angular/material/icon'; // 🆕 US-5.3

/**
 * US-5.2 : Consultation des réservations du Client connecté (lecture seule).
 * GET /api/v1/reservations/my — @PreAuthorize hasAnyAuthority('CLIENT','COMPANY').
 *
 * Hors périmètre volontaire de cette US : détail réservation + annulation
 * (US-5.6), bouton d'action quelconque. Ce composant se contente d'afficher
 * la liste avec le statut codé par couleur (§4.2 Spec Frontend).
 */
@Component({
  selector: 'app-client-reservation-list',
  standalone: true,
  imports: [
          CommonModule, 
          MatCardModule, 
          MatChipsModule, 
          MatProgressSpinnerModule,
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

  constructor() {
    this.loadReservations();
  }

  private loadReservations(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.reservationService.getMyReservations().subscribe({
      next: (reservations) => {
        // Tri par date de création décroissante : les plus récentes en premier
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
}