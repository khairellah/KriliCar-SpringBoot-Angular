import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
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
 * (cf. ReservationController.getByCode) — ce composant se contente d'afficher
 * ce que le backend accepte de renvoyer, et de gérer proprement un 403/404.
 *
 * Hors périmètre volontaire de cette US : toute action de mutation
 * (annulation Client = US-5.6, confirmation/annulation Company = US-5.4/5.5).
 * Vue strictement en lecture seule.
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