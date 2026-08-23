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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BrandService } from '../services/brand.service';
import { Brand } from '../../../core/models/brand.model';
import { BrandRequest } from '../../../core/models/brand-request.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';

interface BrandForm {
  name: FormControl<string>;
}

@Component({
  selector: 'app-brand-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './brand-list.component.html',
  styleUrl: './brand-list.component.scss'
})
export class BrandListComponent {
  private readonly fb = inject(FormBuilder);
  private readonly brandService = inject(BrandService);

  readonly displayedColumns = ['name', 'actions'] as const;

  // ============================ Liste ============================
  readonly brands = signal<Brand[]>([]);
  readonly isListLoading = signal(true);
  readonly listErrorMessage = signal<string | null>(null);

  // ============================ Formulaire (create / edit) ============================
  readonly editingCode = signal<string | null>(null);
  readonly isFormMode = computed(() => this.editingCode() !== null);
  readonly isSubmitting = signal(false);
  readonly formErrorMessage = signal<string | null>(null);
  readonly formSuccessMessage = signal<string | null>(null);

  readonly form: FormGroup<BrandForm> = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', [Validators.required])
  });

  // ============================ Suppression (confirmation inline) ============================
  readonly deleteConfirmCode = signal<string | null>(null);
  readonly isDeleting = signal(false);
  readonly deleteErrorMessage = signal<string | null>(null);

  constructor() {
    this.loadBrands();
  }

  private loadBrands(): void {
    this.isListLoading.set(true);
    this.listErrorMessage.set(null);

    this.brandService.getAllBrands().subscribe({
      next: (brands) => {
        this.brands.set(brands);
        this.isListLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isListLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.listErrorMessage.set(
          body?.message ?? 'Impossible de charger les marques. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  // ============================ Actions formulaire ============================

  startCreate(): void {
    this.editingCode.set('');
    this.form.reset({ name: '' });
    this.formErrorMessage.set(null);
    this.formSuccessMessage.set(null);
  }

  startEdit(brand: Brand): void {
    this.editingCode.set(brand.code);
    this.form.reset({ name: brand.name });
    this.formErrorMessage.set(null);
    this.formSuccessMessage.set(null);
  }

  cancelForm(): void {
    this.editingCode.set(null);
    this.form.reset({ name: '' });
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

    const payload: BrandRequest = this.form.getRawValue();
    const isCreate = code === '';

    const request$ = isCreate
      ? this.brandService.createBrand(payload)
      : this.brandService.updateBrand(code, payload);

    request$.subscribe({
      next: (savedBrand) => {
        this.isSubmitting.set(false);
        this.formSuccessMessage.set(
          isCreate ? 'Marque créée avec succès.' : 'Marque modifiée avec succès.'
        );

        if (isCreate) {
          this.brands.update((list) => [...list, savedBrand]);
        } else {
          this.brands.update((list) =>
            list.map((b) => (b.code === savedBrand.code ? savedBrand : b))
          );
        }

        this.editingCode.set(null);
        this.form.reset({ name: '' });
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
      // DuplicateResourceException : nom de marque déjà utilisé
      const message = body?.message ?? 'Cette marque existe déjà.';
      this.form.controls.name.setErrors({ backend: message });
      this.form.controls.name.markAsTouched();
      this.formErrorMessage.set(message);
      return;
    }

    if (err.status === 404) {
      this.formErrorMessage.set(
        body?.message ?? "Cette marque n'existe plus. Veuillez rafraîchir la liste."
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

    this.brandService.deleteBrand(code).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.brands.update((list) => list.filter((b) => b.code !== code));
        this.deleteConfirmCode.set(null);

        // Si la marque supprimée était en cours d'édition, on referme le formulaire.
        if (this.editingCode() === code) {
          this.cancelForm();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.deleteErrorMessage.set(
          body?.message ?? 'Impossible de supprimer cette marque. Veuillez réessayer plus tard.'
        );
      }
    });
  }
}