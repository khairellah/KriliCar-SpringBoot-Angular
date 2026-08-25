import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CarDTO } from '../../../core/models/car/car.model';
import { CarCreateRequest, CarUpdateRequest } from '../../../core/models/car/car-request.model';
import { PageResponse } from '../../../core/models/page-response.model';
import { CompanyFleetSearchParams } from '../../../core/models/car/company-fleet-search-params.model';

/**
 * US-3.1 / US-3.2 : Service Voitures (Company), aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/CarController.java
 *
 * Les endpoints POST/PUT sont multipart/form-data côté backend :
 * - "car" : JSON (part obligatoire)
 * - "images" (création) / "newImages" (update) : fichiers optionnels
 * - "imagesToDelete" (update uniquement) : liste de CODES métier d'images
 *   à supprimer (JAMAIS d'ID), envoyée en parts de formulaire répétées.
 */
@Injectable({ providedIn: 'root' })
export class CarService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cars`;

  getCompanyCars(companyCode: string, page: number, size: number): Observable<PageResponse<CarDTO>> {
    const params = new HttpParams()
      .set('companyCode', companyCode)
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');
    return this.http.get<PageResponse<CarDTO>>(this.apiUrl, { params });
  }

  /**
   * US-3.4 : GET /api/v1/cars/my-fleet — recherche/filtrage scopé à la
   * Company authentifiée (aucun companyCode transmis, résolu via le token
   * côté backend, cf. CarController.searchMyFleet).
   */
  searchMyFleet(
    filters: CompanyFleetSearchParams,
    page: number,
    size: number
  ): Observable<PageResponse<CarDTO>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');

    if (filters.brand) {
      params = params.set('brand', filters.brand);
    }
    if (filters.model) {
      params = params.set('model', filters.model);
    }
    if (filters.minPrice != null) {
      params = params.set('minPrice', filters.minPrice);
    }
    if (filters.maxPrice != null) {
      params = params.set('maxPrice', filters.maxPrice);
    }
    if (filters.minMileage != null) {
      params = params.set('minMileage', filters.minMileage);
    }
    if (filters.maxMileage != null) {
      params = params.set('maxMileage', filters.maxMileage);
    }
    if (filters.nbrSeats != null) {
      params = params.set('nbrSeats', filters.nbrSeats);
    }
    if (filters.availability) {
      params = params.set('availability', filters.availability);
    }

    return this.http.get<PageResponse<CarDTO>>(`${this.apiUrl}/my-fleet`, { params });
  }

  /** GET /api/v1/cars/{code} — pré-remplissage du formulaire d'édition (scalaires + images) */
  getCarByCode(code: string): Observable<CarDTO> {
    return this.http.get<CarDTO>(`${this.apiUrl}/${code}`);
  }

  /**
   * POST /api/v1/cars (multipart) — part "car" + part(s) "images" optionnelle(s) (US-3.2).
   */
  createCar(data: CarCreateRequest, images?: File[]): Observable<CarDTO> {
    const formData = new FormData();
    formData.append('car', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    if (images?.length) {
      for (const file of images) {
        formData.append('images', file, file.name);
      }
    }

    return this.http.post<CarDTO>(this.apiUrl, formData);
  }

  /**
   * PUT /api/v1/cars/{code} (multipart) — part "car" + part(s) "newImages" optionnelle(s)
   * + parts "imagesToDelete" répétées (codes métier des images existantes à supprimer). US-3.2.
   */
  updateCar(
    code: string,
    data: CarUpdateRequest,
    newImages?: File[],
    imagesToDelete?: string[]
  ): Observable<CarDTO> {
    const formData = new FormData();
    formData.append('car', new Blob([JSON.stringify(data)], { type: 'application/json' }));

    if (newImages?.length) {
      for (const file of newImages) {
        formData.append('newImages', file, file.name);
      }
    }

    if (imagesToDelete?.length) {
      for (const imageCode of imagesToDelete) {
        formData.append('imagesToDelete', imageCode);
      }
    }

    return this.http.put<CarDTO>(`${this.apiUrl}/${code}`, formData);
  }

  deleteCar(code: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${code}`);
  }
}