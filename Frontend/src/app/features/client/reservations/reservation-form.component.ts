import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Réutilisation du service existant (US-3.1/3.2) : GET /api/v1/cars/{code} est un
// endpoint public, réutilisé ici comme dans my-fleet.component.ts/car-form.component.ts
// qui importent déjà des services cross-feature (BrandService/ModelService).
import { CarService } from '../../company/services/car.service';
import { ReservationService } from '../services/reservation.service';
import { CarDTO } from '../../../core/models/car/car.model';
import { ReservationDTO } from '../../../core/models/reservation/reservation.model';
import { ReservationCreateRequest } from '../../../core/models/reservation/reservation-request.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { ReservationStatus } from '../../../core/models/enums';

interface ReservationForm {
  startDate: FormControl<Date | null>;
  nbrJours: FormControl<number>;
}

/**
 * US-5.1 : Création d'une réservation par le Client.
 * Règles métier (conflits de dates, disponibilité, calcul du prix total) gérées
 * exclusivement côté backend (§6.4 Spec Globale) — ce composant ne fait
 * qu'afficher un aperçu informatif (date de fin / prix estimés).
 */
@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './reservation-form.component.html',
  styleUrl: './reservation-form.component.scss'
})
export class ReservationFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly carService = inject(CarService);
  private readonly reservationService = inject(ReservationService);

  readonly carCode = this.route.snapshot.paramMap.get('carCode')!;
  readonly minDate = new Date();

  readonly statusLabels: Record<ReservationStatus, string> = {
    PENDING: 'En attente de confirmation',
    CONFIRMED: 'Confirmée',
    CANCELLED: 'Annulée',
    COMPLETED: 'Terminée'
  };

  // ============================ Chargement de la voiture ============================
  readonly car = signal<CarDTO | null>(null);
  readonly isCarLoading = signal(true);
  readonly carLoadError = signal<string | null>(null);

  // ============================ Formulaire ============================
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successReservation = signal<ReservationDTO | null>(null);

  readonly form: FormGroup<ReservationForm> = this.fb.nonNullable.group({
    startDate: this.fb.control<Date | null>(null, [Validators.required]),
    nbrJours: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)])
  });

  // Signal dérivé des valeurs du formulaire pour les aperçus calculés (date de fin, prix).
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue()
  });

  readonly computedEndDate = computed<Date | null>(() => {
    const { startDate, nbrJours } = this.formValue();
    if (!startDate || !nbrJours || nbrJours < 1) {
      return null;
    }
    // Convention INCLUSIVE (cf. ReservationServiceImpl.calculatePrice) :
    // nbrJours jours facturés = startDate + (nbrJours - 1) jours = endDate.
    const end = new Date(startDate);
    end.setDate(end.getDate() + (nbrJours - 1));
    return end;
  });

  readonly estimatedPrice = computed<number | null>(() => {
    const price = this.car()?.price;
    const { nbrJours } = this.formValue();
    if (price == null || !nbrJours || nbrJours < 1) {
      return null;
    }
    return price * nbrJours;
  });

  constructor() {
    this.loadCar();
  }

  private loadCar(): void {
    this.isCarLoading.set(true);
    this.carLoadError.set(null);

    this.carService.getCarByCode(this.carCode).subscribe({
      next: (car) => {
        this.car.set(car);
        this.isCarLoading.set(false);
        if (car.availability !== 'AVAILABLE') {
          this.carLoadError.set("Cette voiture n'est plus disponible à la réservation.");
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isCarLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.carLoadError.set(
          body?.message ?? 'Impossible de charger les informations de cette voiture.'
        );
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const car = this.car();
    const start = this.form.controls.startDate.value;
    const end = this.computedEndDate();

    if (!car || car.availability !== 'AVAILABLE' || !start || !end) {
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const payload: ReservationCreateRequest = {
      startDate: this.toIsoDate(start),
      endDate: this.toIsoDate(end),
      carCode: this.carCode
    };

    this.reservationService.createReservation(payload).subscribe({
      next: (reservation) => {
        this.isSubmitting.set(false);
        this.successReservation.set(reservation);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.applyServerErrors(err);
      }
    });
  }

  private applyServerErrors(err: HttpErrorResponse): void {
    const body = err.error as ErrorResponse | undefined;

    if (err.status === 400 && body?.errors?.length) {
      // Ex: startDate rejetée par @FutureOrPresent (MethodArgumentNotValidException)
      for (const fieldError of body.errors) {
        if (fieldError.field === 'startDate') {
          this.form.controls.startDate.setErrors({ backend: fieldError.message });
          this.form.controls.startDate.markAsTouched();
        }
      }
      this.errorMessage.set(body.message ?? 'Veuillez corriger les champs invalides.');
      return;
    }

    if (err.status === 400) {
      // IllegalArgumentException (ex: endDate < startDate côté service)
      this.errorMessage.set(body?.message ?? 'Dates de réservation invalides.');
      return;
    }

    if (err.status === 404) {
      this.errorMessage.set(body?.message ?? "Cette voiture n'existe plus.");
      return;
    }

    if (err.status === 409) {
      // IllegalStateException : voiture non AVAILABLE, ou conflit de dates
      this.errorMessage.set(
        body?.message ?? "Le véhicule n'est pas disponible pour la période sélectionnée."
      );
      return;
    }

    this.errorMessage.set(body?.message ?? 'Une erreur est survenue. Veuillez réessayer plus tard.');
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}