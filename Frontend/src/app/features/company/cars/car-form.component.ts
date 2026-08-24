import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { environment } from '../../../../environments/environment';
import { CarService } from '../services/car.service';
import { BrandService } from '../../admin/services/brand.service';
import { ModelService } from '../../admin/services/model.service';
import { Brand } from '../../../core/models/brand.model';
import { Model } from '../../../core/models/model.model';
import { CarDTO } from '../../../core/models/car/car.model';
import { CarImageDTO } from '../../../core/models/car/car-image.model';
import { CarCreateRequest, CarUpdateRequest } from '../../../core/models/car/car-request.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { CarAvailability, CarColor, FuelType, Gearbox } from '../../../core/models/enums';
import { isValidCarImageFile } from '../../../core/utils/car-image-validation.util';

interface CarForm {
  vin: FormControl<string>;
  year: FormControl<number | null>;
  mileage: FormControl<number | null>;
  gearbox: FormControl<Gearbox | null>;
  fuelType: FormControl<FuelType | null>;
  color: FormControl<CarColor | null>;
  nbrSeats: FormControl<number | null>;
  price: FormControl<number | null>;
  description: FormControl<string>;
  availability: FormControl<CarAvailability>;
  brandCode: FormControl<string>;
  modelCode: FormControl<string>;
}

/** US-3.2 : couple fichier sélectionné / URL de prévisualisation (data URL). */
interface NewImageEntry {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-car-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './car-form.component.html',
  styleUrl: './car-form.component.scss'
})
export class CarFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly carService = inject(CarService);
  private readonly brandService = inject(BrandService);
  private readonly modelService = inject(ModelService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly editingCode = signal<string | null>(this.route.snapshot.paramMap.get('code'));
  readonly isEditMode = computed(() => this.editingCode() !== null);

  readonly brands = signal<Brand[]>([]);
  readonly isBrandsLoading = signal(true);
  readonly brandsErrorMessage = signal<string | null>(null);

  readonly models = signal<Model[]>([]);
  readonly isModelsLoading = signal(false);

  readonly isInitialLoading = signal(false);
  readonly initialLoadError = signal<string | null>(null);

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  // ============================ US-3.2 : Gestion des images ============================
  /** Images déjà présentes sur la voiture (édition uniquement), triées par sortOrder. */
  readonly existingImages = signal<CarImageDTO[]>([]);
  /** Codes métier des images existantes marquées pour suppression (imagesToDelete). */
  readonly imagesToDeleteCodes = signal<Set<string>>(new Set());
  /** Nouvelles images sélectionnées (création ou ajout en édition), avec preview. */
  readonly newImages = signal<NewImageEntry[]>([]);
  readonly imagesErrorMessage = signal<string | null>(null);

  readonly gearboxOptions: ReadonlyArray<{ value: Gearbox; label: string }> = [
    { value: 'MANUAL', label: 'Manuelle' },
    { value: 'AUTOMATIC', label: 'Automatique' }
  ];

  readonly fuelTypeOptions: ReadonlyArray<{ value: FuelType; label: string }> = [
    { value: 'GASOLINE', label: 'Essence' },
    { value: 'DIESEL', label: 'Diesel' },
    { value: 'HYBRID', label: 'Hybride' },
    { value: 'ELECTRIC', label: 'Électrique' }
  ];

  readonly colorOptions: ReadonlyArray<{ value: CarColor; label: string }> = [
    { value: 'WHITE', label: 'Blanc' },
    { value: 'BLACK', label: 'Noir' },
    { value: 'GREY', label: 'Gris' },
    { value: 'RED', label: 'Rouge' },
    { value: 'BLUE', label: 'Bleu' },
    { value: 'SILVER', label: 'Argent' },
    { value: 'GREEN', label: 'Vert' },
    { value: 'YELLOW', label: 'Jaune' }
  ];

  readonly availabilityOptions: ReadonlyArray<{ value: CarAvailability; label: string }> = [
    { value: 'AVAILABLE', label: 'Disponible' },
    { value: 'MAINTENANCE', label: 'En maintenance' }
  ];

  readonly form: FormGroup<CarForm> = this.fb.nonNullable.group({
    vin: this.fb.nonNullable.control('', [
      Validators.required,
      Validators.minLength(17),
      Validators.maxLength(17)
    ]),
    year: this.fb.control<number | null>(null, [Validators.required, Validators.min(1980)]),
    mileage: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    gearbox: this.fb.control<Gearbox | null>(null, [Validators.required]),
    fuelType: this.fb.control<FuelType | null>(null, [Validators.required]),
    color: this.fb.control<CarColor | null>(null, [Validators.required]),
    nbrSeats: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(9)
    ]),
    price: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    description: this.fb.nonNullable.control('', [Validators.maxLength(2000)]),
    availability: this.fb.nonNullable.control<CarAvailability>('AVAILABLE'),
    brandCode: this.fb.nonNullable.control('', [Validators.required]),
    modelCode: this.fb.nonNullable.control('', [Validators.required])
  });

  constructor() {
    this.loadBrands();

    const code = this.editingCode();
    if (code) {
      this.loadCarForEdit(code);
    }

    this.form.controls.brandCode.valueChanges.subscribe((brandCode) => {
      if (this.isEditMode()) {
        return;
      }
      this.form.controls.modelCode.setValue('');
      this.models.set([]);
      if (!brandCode) {
        return;
      }
      this.isModelsLoading.set(true);
      this.modelService.getModelsByBrand(brandCode).subscribe({
        next: (models) => {
          this.models.set(models);
          this.isModelsLoading.set(false);
        },
        error: () => this.isModelsLoading.set(false)
      });
    });
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

  private loadCarForEdit(code: string): void {
    this.isInitialLoading.set(true);
    this.initialLoadError.set(null);

    this.carService.getCarByCode(code).subscribe({
      next: (car: CarDTO) => {
        this.form.patchValue(
          {
            vin: car.vin,
            year: car.year,
            mileage: car.mileage,
            gearbox: car.gearbox,
            fuelType: car.fuelType,
            color: car.color,
            nbrSeats: car.nbrSeats,
            price: car.price,
            description: car.description ?? '',
            availability: car.availability === 'RESERVED' ? 'AVAILABLE' : car.availability,
            brandCode: car.brandCode,
            modelCode: car.modelCode
          },
          { emitEvent: false }
        );
        this.form.controls.brandCode.disable({ emitEvent: false });
        this.form.controls.modelCode.disable({ emitEvent: false });

        // US-3.2 : initialisation des images existantes (triées par sortOrder),
        // et remise à zéro de l'état de sélection (nouvelles images / suppressions).
        this.existingImages.set(
          [...(car.images ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        );
        this.imagesToDeleteCodes.set(new Set());
        this.newImages.set([]);
        this.imagesErrorMessage.set(null);

        this.isModelsLoading.set(true);
        this.modelService.getModelsByBrand(car.brandCode).subscribe({
          next: (models) => {
            this.models.set(models);
            this.isModelsLoading.set(false);
          },
          error: () => this.isModelsLoading.set(false)
        });

        this.isInitialLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isInitialLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.initialLoadError.set(
          body?.message ?? 'Impossible de charger cette voiture. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  // ============================ US-3.2 : Actions images ============================

  /** URL de prévisualisation d'une image déjà stockée côté serveur (cf. environment.filesBaseUrl). */
  resolveImageUrl(path: string): string {
    return `${environment.filesBaseUrl}${path}`;
  }

  onNewImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.imagesErrorMessage.set(null);

    for (const file of files) {
      if (!isValidCarImageFile(file)) {
        this.imagesErrorMessage.set(
          `Fichier '${file.name}' invalide : seules les images JPG, JPEG, PNG, WEBP ou GIF sont autorisées.`
        );
        continue;
      }

      const entry: NewImageEntry = { file, previewUrl: '' };
      this.newImages.update((list) => [...list, entry]);

      const reader = new FileReader();
      reader.onload = () => {
        entry.previewUrl = reader.result as string;
        // Mutation de l'objet interne : on force la mise à jour du signal
        // (nouvelle référence de tableau) pour déclencher le re-rendu.
        this.newImages.update((list) => [...list]);
      };
      reader.readAsDataURL(file);
    }

    // Permet de resélectionner le(s) même(s) fichier(s) après suppression.
    input.value = '';
  }

  removeNewImage(index: number): void {
    this.newImages.update((list) => list.filter((_, i) => i !== index));
  }

  toggleDeleteExisting(code: string): void {
    this.imagesToDeleteCodes.update((set) => {
      const next = new Set(set);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }

  isMarkedForDeletion(code: string): boolean {
    return this.imagesToDeleteCodes().has(code);
  }

  // ============================ Soumission ============================

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.imagesErrorMessage.set(null);
    this.isSubmitting.set(true);

    const raw = this.form.getRawValue();
    const newImageFiles = this.newImages().map((entry) => entry.file);

    if (this.isEditMode()) {
      const payload: CarUpdateRequest = {
        vin: raw.vin,
        year: raw.year as number,
        mileage: raw.mileage,
        gearbox: raw.gearbox,
        fuelType: raw.fuelType,
        color: raw.color,
        nbrSeats: raw.nbrSeats,
        price: raw.price,
        description: raw.description,
        availability: raw.availability
      };

      this.carService
        .updateCar(
          this.editingCode()!,
          payload,
          newImageFiles,
          Array.from(this.imagesToDeleteCodes())
        )
        .subscribe({
          next: () => {
            this.isSubmitting.set(false);
            this.router.navigateByUrl('/company/cars');
          },
          error: (err: HttpErrorResponse) => {
            this.isSubmitting.set(false);
            this.applyServerErrors(err);
          }
        });
    } else {
      const payload: CarCreateRequest = {
        vin: raw.vin,
        year: raw.year as number,
        mileage: raw.mileage,
        gearbox: raw.gearbox,
        fuelType: raw.fuelType,
        color: raw.color,
        nbrSeats: raw.nbrSeats,
        price: raw.price,
        description: raw.description,
        availability: raw.availability,
        brandCode: raw.brandCode,
        modelCode: raw.modelCode
      };

      this.carService.createCar(payload, newImageFiles).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.router.navigateByUrl('/company/cars');
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.applyServerErrors(err);
        }
      });
    }
  }

  private applyServerErrors(err: HttpErrorResponse): void {
    const body = err.error as ErrorResponse | undefined;

    if (err.status === 400 && body?.errors?.length) {
      for (const fieldError of body.errors) {
        const control = this.form.get(fieldError.field);
        if (control) {
          control.setErrors({ backend: fieldError.message });
          control.markAsTouched();
        }
      }
      this.errorMessage.set(body.message ?? 'Veuillez corriger les champs invalides.');
      return;
    }

    if (err.status === 409) {
      const message = body?.message ?? 'Ce VIN est déjà utilisé par une autre voiture.';
      this.form.controls.vin.setErrors({ backend: message });
      this.form.controls.vin.markAsTouched();
      this.errorMessage.set(message);
      return;
    }

    if (err.status === 400) {
      // Couvre notamment le rejet KC-20 d'un fichier image invalide côté serveur.
      this.errorMessage.set(body?.message ?? 'Requête invalide.');
      return;
    }

    if (err.status === 404) {
      this.errorMessage.set(
        body?.message ?? 'Marque, modèle, voiture ou image introuvable. Veuillez rafraîchir la page.'
      );
      return;
    }

    this.errorMessage.set(body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.');
  }
}