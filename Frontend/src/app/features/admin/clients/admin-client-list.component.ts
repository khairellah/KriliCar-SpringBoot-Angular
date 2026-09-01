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

import { AdminClientService } from '../services/admin-client.service';
import { ClientAdminSummaryDTO } from '../../../core/models/admin/client-admin-summary.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';

/** Filtre à 3 états : '' = Tous, 'true' = Oui, 'false' = Non (jamais transmis tel quel au backend). */
type TriStateFilter = '' | 'true' | 'false';

interface FiltersForm {
  active: FormControl<TriStateFilter>;
}

/**
 * US-7.3 : Liste des clients (vue Admin), filtrable par statut de compte
 * (active), filtre optionnel unique — GET /api/v1/admins/clients?active=.
 *
 * Écran strictement en LECTURE SEULE : aucune action d'activation/
 * désactivation (US-7.4) ni de lien vers un détail complet (US-7.5), les
 * deux étant hors périmètre de cette US.
 *
 * Même pattern que AdminCompanyListComponent (US-7.1), simplifié : un seul
 * filtre (pas de "boosted", concept propre à Company) et sans colonne
 * "actions".
 */
@Component({
  selector: 'app-admin-client-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './admin-client-list.component.html',
  styleUrl: './admin-client-list.component.scss'
})
export class AdminClientListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminClientService = inject(AdminClientService);

  readonly displayedColumns = ['name', 'email', 'phone', 'active', 'createdAt'] as const;

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

    const { active } = this.form.getRawValue();

    this.adminClientService.getClients(this.toBooleanOrUndefined(active)).subscribe({
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
}