import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CarDTO } from '../../../core/models/car/car.model';
import { CarCreateRequest, CarUpdateRequest } from '../../../core/models/car/car-request.model';
import { PageResponse } from '../../../core/models/page-response.model';

/**
 * US-3.1 : Service Voitures (Company), aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/CarController.java
 *
 * ⚠️ Les endpoints POST/PUT exigent multipart/form-data côté backend
 * (part "car" en JSON + "images"/"newImages" optionnelles, "required = false").
 * Cette US ne gère pas les images (US-3.2) : les parts fichiers sont
 * simplement omises, ce que le backend autorise nativement.
 */
@Injectable({ providedIn: 'root' })
export class CarService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/cars`;

  /**
   * GET /api/v1/cars?companyCode=...&page=...&size=...
   * Endpoint public côté backend ; utilisé ici pour lister le parc de la
   * Company connectée. US-3.4 réutilisera /cars/my-fleet pour la recherche
   * avancée scopée automatiquement au token — hors périmètre de cette US.
   */
  getCompanyCars(companyCode: string, page: number, size: number): Observable<PageResponse<CarDTO>> {
    const params = new HttpParams()
      .set('companyCode', companyCode)
      .set('page', page)
      .set('size', size)
      .set('sort', 'createdAt,desc');
    return this.http.get<PageResponse<CarDTO>>(this.apiUrl, { params });
  }

  /** GET /api/v1/cars/{code} — pré-remplissage du formulaire d'édition */
  getCarByCode(code: string): Observable<CarDTO> {
    return this.http.get<CarDTO>(`${this.apiUrl}/${code}`);
  }

  /** POST /api/v1/cars (multipart) — part "car" uniquement, pas de part "images" */
  createCar(data: CarCreateRequest): Observable<CarDTO> {
    const formData = new FormData();
    formData.append('car', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    return this.http.post<CarDTO>(this.apiUrl, formData);
  }

  /** PUT /api/v1/cars/{code} (multipart) — part "car" uniquement */
  updateCar(code: string, data: CarUpdateRequest): Observable<CarDTO> {
    const formData = new FormData();
    formData.append('car', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    return this.http.put<CarDTO>(`${this.apiUrl}/${code}`, formData);
  }

  /** DELETE /api/v1/cars/{code} */
  deleteCar(code: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${code}`);
  }
}