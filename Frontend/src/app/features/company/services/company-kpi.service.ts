// Frontend/src/app/features/company/services/company-kpi.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CompanyKpiDTO } from '../../../core/models/company/company-kpi.model';

/**
 * US-8.2 : Service dédié aux KPI de la Company authentifiée, aligné 1-pour-1
 * sur Backend/src/main/java/com/kriliCar/controllers/CompanyKpiController.java
 * (@PreAuthorize("hasAuthority('COMPANY')") côté backend).
 *
 * Un seul endpoint de lecture, scope automatiquement résolu via le token
 * (Principal côté backend) — aucun paramètre companyCode à envoyer, même
 * pattern que /cars/my-fleet (US-3.4).
 */
@Injectable({ providedIn: 'root' })
export class CompanyKpiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/companies/kpi`;

  /** GET /api/v1/companies/kpi/my */
  getMyKpi(): Observable<CompanyKpiDTO> {
    return this.http.get<CompanyKpiDTO>(`${this.apiUrl}/my`);
  }
}