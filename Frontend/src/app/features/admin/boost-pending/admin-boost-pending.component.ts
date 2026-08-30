// Frontend/src/app/features/admin/boost-pending/admin-boost-pending.component.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminCompanyService } from '../services/admin-company.service';
import { CompanyProfileResponse } from '../../../core/models/company/company-profile-response.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';

/**
 * US-6.2 : Écran Admin listant les sociétés ayant une demande de Boost en
 * attente (GET /api/v1/admins/companies/boost/pending), avec action
 * "Activer" (PATCH /api/v1/admins/companies/{code}/boost/activate).
 *
 * Règles UI (§4.4 Spec Frontend) :
 * - Tri par boostRequestedAt croissant (la plus ancienne demande en premier).
 * - Bouton "Activer" désactivé pendant le traitement d'une ligne ; confirmation
 *   inline avant activation (même pattern que brand-list / reservation-list).
 * - 409 (idempotence backend : déjà actif ou plus de demande en attente) :
 *   message backend affiché tel quel, puis rechargement de la liste (la
 *   société a pu être traitée entre-temps par un autre Admin).
 */
@Component({
  selector: 'app-admin-boost-pending',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-boost-pending.component.html',
  styleUrl: './admin-boost-pending.component.scss'
})
export class AdminBoostPendingComponent {
  private readonly adminCompanyService = inject(AdminCompanyService);

  readonly displayedColumns = ['companyName', 'email', 'city', 'boostRequestedAt', 'actions'] as const;

  readonly companies = signal<CompanyProfileResponse[]>([]);
  readonly isListLoading = signal(true);
  readonly listErrorMessage = signal<string | null>(null);

  // Confirmation inline avant activation (une seule ligne à la fois)
  readonly confirmingCode = signal<string | null>(null);
  readonly activatingCode = signal<string | null>(null);
  readonly actionErrorMessage = signal<string | null>(null);

  constructor() {
    this.loadPendingRequests();
  }

  private loadPendingRequests(): void {
    this.isListLoading.set(true);
    this.listErrorMessage.set(null);

    this.adminCompanyService.getPendingBoostRequests().subscribe({
      next: (companies) => {
        // Tri par ancienneté : boostRequestedAt croissant (la plus ancienne en premier).
        // boostRequestedAt peut théoriquement être null pour une société sans demande
        // (ne devrait pas arriver ici puisque le backend ne renvoie que boostRequested=true,
        // mais on protège quand même le tri contre un cas limite).
        const sorted = [...companies].sort((a, b) => {
          const aTime = a.boostRequestedAt ? new Date(a.boostRequestedAt).getTime() : 0;
          const bTime = b.boostRequestedAt ? new Date(b.boostRequestedAt).getTime() : 0;
          return aTime - bTime;
        });
        this.companies.set(sorted);
        this.isListLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isListLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.listErrorMessage.set(
          body?.message ??
            'Impossible de charger les demandes de Boost en attente. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  // ============================ Activation (confirmation inline) ============================

  askActivate(code: string): void {
    this.actionErrorMessage.set(null);
    this.confirmingCode.set(code);
  }

  cancelActivate(): void {
    this.confirmingCode.set(null);
  }

  confirmActivate(code: string): void {
    this.actionErrorMessage.set(null);
    this.activatingCode.set(code);

    this.adminCompanyService.activateBoost(code).subscribe({
      next: () => {
        this.activatingCode.set(null);
        this.confirmingCode.set(null);
        // La société n'a plus de demande en attente : retrait immédiat de la liste
        // (rechargement complet évité — pas nécessaire, la liste locale est cohérente).
        this.companies.update((list) => list.filter((c) => c.code !== code));
      },
      error: (err: HttpErrorResponse) => {
        this.activatingCode.set(null);
        this.confirmingCode.set(null);
        const body = err.error as ErrorResponse | undefined;

        if (err.status === 409) {
          // Idempotence : déjà actif, ou plus de demande en attente (traité entre-temps).
          // On recharge la liste pour refléter l'état réel côté serveur.
          this.actionErrorMessage.set(
            body?.message ?? 'Cette société a déjà été traitée. La liste va être actualisée.'
          );
          this.loadPendingRequests();
          return;
        }

        if (err.status === 404) {
          this.actionErrorMessage.set(
            body?.message ?? 'Cette société est introuvable. La liste va être actualisée.'
          );
          this.loadPendingRequests();
          return;
        }

        this.actionErrorMessage.set(
          body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}