import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminClientService } from '../services/admin-client.service';
import { ClientDetailResponse } from '../../../core/models/admin/client-detail-response.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { ReservationStatus } from '../../../core/models/enums';
import { RESERVATION_STATUS_DESCRIPTIONS } from '../../../core/utils/reservation-status.util';

/**
 * US-7.5 : Détail complet d'un client (vue Admin), lecture seule.
 * GET /api/v1/admins/clients/{code} -> ClientDetailResponse
 * (profil complet + réservations + wishlist + statistiques).
 *
 * Aucune action de mutation ici : activation/désactivation (US-7.4) reste
 * pilotée depuis AdminClientListComponent.
 */
@Component({
  selector: 'app-admin-client-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule
  ],
  templateUrl: './admin-client-detail.component.html',
  styleUrl: './admin-client-detail.component.scss'
})
export class AdminClientDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly adminClientService = inject(AdminClientService);

  private readonly code = this.route.snapshot.paramMap.get('code')!;

  readonly client = signal<ClientDetailResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly reservationsDisplayedColumns = ['car', 'dates', 'price', 'status'] as const;

  readonly statusLabels: Record<ReservationStatus, string> = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmée',
    CANCELLED: 'Annulée',
    COMPLETED: 'Terminée'
  };

  readonly statusDescriptions = RESERVATION_STATUS_DESCRIPTIONS;

  constructor() {
    this.loadDetail();
  }

  private loadDetail(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.adminClientService.getClientDetail(this.code).subscribe({
      next: (client) => {
        this.client.set(client);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.errorMessage.set(
          body?.message ??
            'Impossible de charger le détail de ce client. Veuillez réessayer plus tard.'
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
}