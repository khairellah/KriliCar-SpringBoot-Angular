import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { AuthService } from '../../../core/auth/auth.service';
import { CarService } from '../services/car.service';
import { CarDTO } from '../../../core/models/car/car.model';
import { ErrorResponse } from '../../../core/models/errors/error-response.model';
import { CarAvailability } from '../../../core/models/enums';

@Component({
  selector: 'app-car-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './car-list.component.html',
  styleUrl: './car-list.component.scss'
})
export class CarListComponent {
  private readonly authService = inject(AuthService);
  private readonly carService = inject(CarService);
  private readonly router = inject(Router);

  readonly displayedColumns = ['brandModel', 'vin', 'year', 'price', 'availability', 'actions'] as const;

  readonly cars = signal<CarDTO[]>([]);
  readonly totalElements = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  readonly isListLoading = signal(true);
  readonly listErrorMessage = signal<string | null>(null);

  readonly deleteConfirmCode = signal<string | null>(null);
  readonly isDeleting = signal(false);
  readonly deleteErrorMessage = signal<string | null>(null);

  readonly availabilityLabels: Record<CarAvailability, string> = {
    AVAILABLE: 'Disponible',
    MAINTENANCE: 'En maintenance',
    RESERVED: 'Réservée'
  };

  constructor() {
    this.loadCars();
  }

  private loadCars(): void {
    const companyCode = this.authService.code();
    if (!companyCode) {
      this.isListLoading.set(false);
      this.listErrorMessage.set('Impossible de déterminer votre société. Veuillez vous reconnecter.');
      return;
    }

    this.isListLoading.set(true);
    this.listErrorMessage.set(null);

    this.carService.getCompanyCars(companyCode, this.pageIndex(), this.pageSize()).subscribe({
      next: (page) => {
        this.cars.set(page.content);
        this.totalElements.set(page.totalElements);
        this.isListLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.isListLoading.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.listErrorMessage.set(
          body?.message ?? 'Impossible de charger vos voitures. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadCars();
  }

  goToCreate(): void {
    this.router.navigateByUrl('/company/cars/new');
  }

  goToEdit(code: string): void {
    this.router.navigateByUrl(`/company/cars/${code}/edit`);
  }

  // ============================ Suppression (confirmation inline) ============================

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

    this.carService.deleteCar(code).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.deleteConfirmCode.set(null);
        // Rechargement de la page courante : la pagination peut se décaler
        // si la voiture supprimée était le dernier élément de la page.
        this.loadCars();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleting.set(false);
        const body = err.error as ErrorResponse | undefined;
        this.deleteErrorMessage.set(
          body?.message ?? 'Impossible de supprimer cette voiture. Veuillez réessayer plus tard.'
        );
      }
    });
  }

  getAvailabilityLabel(availability: CarAvailability): string {
    return this.availabilityLabels[availability];
  }
}