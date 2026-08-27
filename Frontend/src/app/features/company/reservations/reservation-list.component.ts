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
/**
 * US-5.2 : Consultation des réservations reçues par la Company connectée
 * (lecture seule). GET /api/v1/reservations/my.
 *
 * Hors périmètre volontaire de cette US : boutons Confirmer/Annuler
 * (US-5.3/5.4/5.5) et badge de notification PENDING (US-5.7).
 */
@Component({
  selector: 'app-company-reservation-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatChipsModule, MatProgressSpinnerModule, RouterLink, MatIconModule],
  templateUrl: './reservation-list.component.html',
  styleUrl: './reservation-list.component.scss'
})
export class CompanyReservationListComponent {
  private readonly reservationService = inject(ReservationService);
// 🆕 US-5.3 : colonne "actions" ajoutée
  readonly displayedColumns = ['car', 'client', 'dates', 'price', 'status','actions'] as const;

  readonly reservations = signal<ReservationDTO[]>([]);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly statusLabels: Record<ReservationStatus, string> = {
    PENDING: 'En attente',
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
}