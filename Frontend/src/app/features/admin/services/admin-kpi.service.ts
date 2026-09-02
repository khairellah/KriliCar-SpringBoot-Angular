// Frontend/src/app/features/admin/services/admin-kpi.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AdminKpiDTO } from '../../../core/models/admin/admin-kpi.model';

/**
 * US-8.1 : Service dédié aux KPI globaux de la plateforme (vue Admin), aligné
 * 1-pour-1 sur Backend/src/main/java/com/kriliCar/controllers/AdminKpiController.java
 * (@PreAuthorize("hasAuthority('ADMIN')") côté backend).
 *
 * Un seul endpoint de lecture, aucune mutation possible depuis ce service.
 */
@Injectable({ providedIn: 'root' })
export class AdminKpiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admins/kpi`;

  /** GET /api/v1/admins/kpi/global */
  getGlobalKpi(): Observable<AdminKpiDTO> {
    return this.http.get<AdminKpiDTO>(`${this.apiUrl}/global`);
  }
}