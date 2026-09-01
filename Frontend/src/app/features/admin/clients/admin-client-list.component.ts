import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminClientService } from '../services/admin-client.service';
import { ClientAdminSummaryDTO } from '../../../core/models/admin/client-admin-summary.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';

import { RouterLink } from '@angular/router';

/** Filtre à 3 états : '' = Tous, 'true' = Oui, 'false' = Non (jamais transmis tel quel au backend). */
type TriStateFilter = '' | 'true' | 'false';

interface FiltersForm {
  active: FormControl<TriStateFilter>;
}

/**
 * US-7.3 : Liste des clients (vue Admin), filtrable par statut de compte
 * (active), filtre optionnel unique — GET /api/v1/admins/clients?active=.
 *
 * US-7.4 : Ajoute l'action d'activation/désactivation de compte
 * (PATCH /api/v1/admins/clients/{code}/activate|deactivate) :
 * - Un seul bouton contextuel par ligne : "Désactiver" si le compte est actif,
 *   "Activer" s'il est inactif — jamais les deux boutons simultanément, pour
 *   ne jamais laisser l'utilisateur déclencher une erreur 409 évitable
 *   (idempotence stricte côté backend, cf. ClientServiceImpl.setClientActiveStatus).
 * - Confirmation inline avant l'appel API (même pattern que
 *   AdminCompanyListComponent — US-7.2).
 * - Effet immédiat côté backend : login bloqué + JWT déjà émis inopérant dès
 *   la requête suivante — un avertissement est affiché avant confirmation
 *   d'une désactivation.
 *
 * US-7.5 (détail complet) reste hors périmètre de ce composant.
 */
@Component({
  selector: 'app-admin-client-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink, // 🆕 US-7.5
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './admin-client-list.component.html',
  styleUrl: './admin-client-list.component.scss'
})
export class AdminClientListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminClientService = inject(AdminClientService);

  // 🔧 US-7.4 : ajout de la colonne "actions"
  readonly displayedColumns = ['name', 'email', 'phone', 'active', 'createdAt', 'actions'] as const;

  readonly activeFilterOptions: ReadonlyArray<{ value: TriStateFilter; label: string }> = [
    { value: '', label: 'Tous' },
    { value: 'true', label: 'Actifs' },
    { value: 'false', label: 'Inactifs' }
  ];

  readonly form: FormGroup<FiltersForm> = this.fb.nonNullable.group({
    active: this.fb.nonNullable.control<TriStateFilter>('')
  });

  readonly clients = signal<ClientAdminSummaryDTO[]>([]);
  readonly isListLoading = signal(true);
  readonly listErrorMessage = signal<string | null>(null);

  // Filtre "active" réellement appliqué à la dernière recherche : utilisé
  // pour décider si une ligne doit être retirée de la liste après un
  // changement de statut qui ne correspond plus au filtre actif (US-7.4).
  private lastActiveFilter: boolean | undefined = undefined;

  // ============================ US-7.4 : Activation / Désactivation ============================
  /** Code du client en attente de confirmation inline, et action ciblée. */
  readonly confirmingAction = signal<{ code: string; targetActive: boolean } | null>(null);
  readonly updatingCode = signal<string | null>(null);
  readonly actionErrorMessage = signal<string | null>(null);

  constructor() {
    this.loadClients();
  }

  onSubmit(): void {
    this.loadClients();
  }

  onReset(): void {
    this.form.reset({ active: '' });
    this.loadClients();
  }

  /** Convertit le filtre 3-états du formulaire ('' | 'true' | 'false') en boolean|undefined. */
  private toBooleanOrUndefined(value: TriStateFilter): boolean | undefined {
    if (value === '') {
      return undefined;
    }
    return value === 'true';
  }

  private loadClients(): void {
    this.isListLoading.set(true);
    this.listErrorMessage.set(null);
    this.actionErrorMessage.set(null);

    const { active } = this.form.getRawValue();
    const activeFilter = this.toBooleanOrUndefined(active);
    this.lastActiveFilter = activeFilter;

    this.adminClientService.getClients(activeFilter).subscribe({
      next: (clients) => {
        this.clients.set(clients);
        this.isListLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isListLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.listErrorMessage.set(
          body?.message ?? 'Impossible de charger les clients. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  // ============================ US-7.4 : Actions activation/désactivation ============================

  /** true = demande d'activation, false = demande de désactivation. */
  askToggleActive(code: string, targetActive: boolean): void {
    this.actionErrorMessage.set(null);
    this.confirmingAction.set({ code, targetActive });
  }

  cancelToggleActive(): void {
    this.confirmingAction.set(null);
  }

  isConfirming(code: string): boolean {
    return this.confirmingAction()?.code === code;
  }

  confirmToggleActive(code: string): void {
    const action = this.confirmingAction();
    if (!action || action.code !== code) {
      return;
    }

    this.actionErrorMessage.set(null);
    this.updatingCode.set(code);

    const request$ = action.targetActive
      ? this.adminClientService.activateClient(code)
      : this.adminClientService.deactivateClient(code);

    request$.subscribe({
      next: (updated) => {
        this.updatingCode.set(null);
        this.confirmingAction.set(null);

        // Si un filtre "active" est appliqué et que le nouvel état ne
        // correspond plus, le client n'apparaîtrait plus dans une vraie
        // recherche : on le retire directement de la liste locale plutôt
        // que de forcer un rechargement complet.
        if (this.lastActiveFilter !== undefined && updated.active !== this.lastActiveFilter) {
          this.clients.update((list) => list.filter((c) => c.code !== code));
          return;
        }

        this.clients.update((list) =>
          list.map((c) => (c.code === updated.code ? updated : c))
        );
      },
      error: (err: HttpErrorResponse) => {
        this.updatingCode.set(null);
        this.confirmingAction.set(null);
        const body = err.error as ErrorResponse | undefined;

        if (err.status === 409) {
          // Idempotence : déjà dans l'état demandé (traité entre-temps par un
          // autre Admin) — on recharge la liste pour refléter l'état réel serveur.
          this.actionErrorMessage.set(
            body?.message ?? 'Ce client a déjà été traité. La liste va être actualisée.'
          );
          this.loadClients();
          return;
        }

        if (err.status === 404) {
          this.actionErrorMessage.set(
            body?.message ?? 'Ce client est introuvable. La liste va être actualisée.'
          );
          this.loadClients();
          return;
        }

        this.actionErrorMessage.set(
          body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}