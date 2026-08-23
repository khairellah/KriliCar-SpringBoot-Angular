import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ModelService } from '../services/model.service';
import { BrandService } from '../services/brand.service';
import { Model } from '../../../core/models/model.model';
import { ModelRequest } from '../../../core/models/model-request.model';
import { Brand } from '../../../core/models/brand.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';

interface ModelForm {
  name: FormControl<string>;
  brandCode: FormControl<string>;
}

@Component({
  selector: 'app-model-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './model-list.component.html',
  styleUrl: './model-list.component.scss'
})
export class ModelListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly modelService = inject(ModelService);
  private readonly brandService = inject(BrandService);

  readonly displayedColumns = ['brandName', 'name', 'actions'] as const;

  // ============================ Marques (pour filtre + select dépendant) ============================
  readonly brands = signal<Brand[]>([]);
  readonly isBrandsLoading = signal(true);
  readonly brandsErrorMessage = signal<string | null>(null);

  // ============================ Filtre "Marque" (select dépendant, US-2.2) ============================
  readonly filterBrandCode = signal<string>(''); // '' = toutes les marques

  // ============================ Liste des modèles ============================
  readonly models = signal<Model[]>([]);
  readonly isListLoading = signal(true);
  readonly listErrorMessage = signal<string | null>(null);

  // ============================ Formulaire (create / edit) ============================
  readonly editingCode = signal<string | null>(null);
  readonly isFormMode = computed(() => this.editingCode() !== null);
  readonly isSubmitting = signal(false);
  readonly formErrorMessage = signal<string | null>(null);
  readonly formSuccessMessage = signal<string | null>(null);

  readonly form: FormGroup<ModelForm> = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required]),
    brandCode: this.fb.nonNullable.control('', [Validators.required])
  });

  // ============================ Suppression (confirmation inline) ============================
  readonly deleteConfirmCode = signal<string | null>(null);
  readonly isDeleting = signal(false);
  readonly deleteErrorMessage = signal<string | null>(null);

  constructor() {
    this.loadBrands();
    this.loadModels();
  }

  private loadBrands(): void {
    this.isBrandsLoading.set(true);
    this.brandsErrorMessage.set(null);

    this.brandService.getAllBrands().subscribe({
      next: (brands) => {
        this.brands.set(brands);
        this.isBrandsLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isBrandsLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.brandsErrorMessage.set(
          body?.message ?? 'Impossible de charger les marques. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  private loadModels(): void {
    this.isListLoading.set(true);
    this.listErrorMessage.set(null);

    const brandCode = this.filterBrandCode();
    const request$ = brandCode
      ? this.modelService.getModelsByBrand(brandCode)
      : this.modelService.getAllModels();

    request$.subscribe({
      next: (models) => {
        this.models.set(models);
        this.isListLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isListLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.listErrorMessage.set(
          body?.message ?? 'Impossible de charger les modèles. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  /** US-2.2 : select dépendant Marque → Modèles (GET /models/brand/{brandCode}) */
  onFilterBrandChange(brandCode: string): void {
    this.filterBrandCode.set(brandCode);
    this.loadModels();
  }

  // ============================ Actions formulaire ============================

  startCreate(): void {
    this.editingCode.set('');
    // Pré-sélectionne la marque du filtre courant si elle est définie,
    // pour fluidifier la saisie quand l'Admin travaille marque par marque.
    this.form.reset({ name: '', brandCode: this.filterBrandCode() || '' });
    this.formErrorMessage.set(null);
    this.formSuccessMessage.set(null);
  }

  startEdit(model: Model): void {
    this.editingCode.set(model.code);
    this.form.reset({ name: model.name, brandCode: model.brandCode });
    this.formErrorMessage.set(null);
    this.formSuccessMessage.set(null);
  }

  cancelForm(): void {
    this.editingCode.set(null);
    this.form.reset({ name: '', brandCode: '' });
    this.formErrorMessage.set(null);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const code = this.editingCode();
    if (code === null) {
      return;
    }

    this.formErrorMessage.set(null);
    this.formSuccessMessage.set(null);
    this.isSubmitting.set(true);

    const payload: ModelRequest = this.form.getRawValue();
    const isCreate = code === '';

    const request$ = isCreate
      ? this.modelService.createModel(payload)
      : this.modelService.updateModel(code, payload);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.formSuccessMessage.set(
          isCreate ? 'Modèle créé avec succès.' : 'Modèle modifié avec succès.'
        );

        // Rechargement complet plutôt que patch local du signal : un modèle
        // modifié peut changer de marque et donc sortir du filtre actif.
        this.loadModels();

        this.editingCode.set(null);
        this.form.reset({ name: '', brandCode: '' });
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.applyFormServerErrors(err);
      }
    });
  }

  private applyFormServerErrors(err: HttpErrorResponse): void {
    const body = err.error as ErrorResponse | undefined;

    if (err.status === 400 && body?.errors?.length) {
      for (const fieldError of body.errors) {
        const control = this.form.get(fieldError.field);
        if (control) {
          control.setErrors({ backend: fieldError.message });
          control.markAsTouched();
        }
      }
      this.formErrorMessage.set(body.message ?? 'Veuillez corriger les champs invalides.');
      return;
    }

    if (err.status === 409) {
      // DuplicateResourceException : nom de modèle déjà utilisé pour cette marque
      const message = body?.message ?? 'Ce modèle existe déjà pour cette marque.';
      this.form.controls.name.setErrors({ backend: message });
      this.form.controls.name.markAsTouched();
      this.formErrorMessage.set(message);
      return;
    }

    if (err.status === 404) {
      // ResourceNotFoundException : marque ou modèle introuvable
      this.formErrorMessage.set(
        body?.message ?? 'Marque ou modèle introuvable. Veuillez rafraîchir la page.'
      );
      return;
    }

    this.formErrorMessage.set(
      body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.'
    );
  }

  // ============================ Actions suppression ============================

  askDelete(code: string): void {
    this.deleteErrorMessage.set(null);
    this.deleteConfirmCode.set(code);
  }

  cancelDelete(): void {
    this.deleteConfirmCode.set(null);
    this.deleteErrorMessage.set(null);
  }

  confirmDelete(code: string): void {
    this.isDeleting.set(true);
    this.deleteErrorMessage.set(null);

    this.modelService.deleteModel(code).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.models.update((list) => list.filter((m) => m.code !== code));
        this.deleteConfirmCode.set(null);

        if (this.editingCode() === code) {
          this.cancelForm();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.deleteErrorMessage.set(
          body?.message ?? 'Impossible de supprimer ce modèle. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}