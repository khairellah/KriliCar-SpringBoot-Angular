import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Model } from '../../../core/models/model.model';
import { ModelRequest } from '../../../core/models/model-request.model';

/**
 * US-2.2 : Service CRUD Modèles, aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/ModelController.java
 *
 * GET (liste + détail + par marque) : public côté backend, mais cet écran
 * est réservé à l'Admin (roleGuard). POST/PUT/DELETE : ADMIN uniquement
 * côté backend.
 */
@Injectable({ providedIn: 'root' })
export class ModelService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/models`;

  /** GET /api/v1/models */
  getAllModels(): Observable<Model[]> {
    return this.http.get<Model[]>(this.apiUrl);
  }

  /** GET /api/v1/models/brand/{brandCode} — select dépendant Marque → Modèles */
  getModelsByBrand(brandCode: string): Observable<Model[]> {
    return this.http.get<Model[]>(`${this.apiUrl}/brand/${brandCode}`);
  }

  /** POST /api/v1/models */
  createModel(data: ModelRequest): Observable<Model> {
    return this.http.post<Model>(this.apiUrl, data);
  }

  /** PUT /api/v1/models/{code} */
  updateModel(code: string, data: ModelRequest): Observable<Model> {
    return this.http.put<Model>(`${this.apiUrl}/${code}`, data);
  }

  /** DELETE /api/v1/models/{code} */
  deleteModel(code: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${code}`);
  }
}