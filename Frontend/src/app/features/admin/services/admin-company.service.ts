// Frontend/src/app/features/admin/services/admin-company.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { CompanyProfileResponse } from '../../../core/models/company/company-profile-response.model';

/**
 * US-6.2 : Service Admin dédié aux sociétés, aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/AdminCompanyController.java
 * (@PreAuthorize("hasAuthority('ADMIN')") côté backend sur les deux endpoints).
 *
 * ⚠️ Périmètre strict de cette US : uniquement la liste des demandes de Boost
 * en attente et leur activation. Les endpoints US-7.1/7.2/7.5 (liste filtrable,
 * activation/désactivation de compte, détail complet) ne sont volontairement
 * PAS implémentés ici — ce service sera complété lors de ces US ultérieures.
 */
@Injectable({ providedIn: 'root' })
export class AdminCompanyService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admins/companies`;

  /**
   * GET /api/v1/admins/companies/boost/pending
   * Liste des sociétés ayant une demande de Boost en attente
   * (boostRequested = true). Le tri par ancienneté (boostRequestedAt croissant)
   * est effectué côté Frontend (cf. AdminBoostPendingComponent), le backend
   * ne garantit pas d'ordre particulier.
   */
  getPendingBoostRequests(): Observable<CompanyProfileResponse[]> {
    return this.http.get<CompanyProfileResponse[]>(`${this.apiUrl}/boost/pending`);
  }

  /**
   * PATCH /api/v1/admins/companies/{code}/boost/activate
   * Valide et active le Boost pour la société donnée.
   * Idempotent côté backend : 409 (IllegalStateException) si le Boost est déjà
   * actif ou si aucune demande n'est en attente pour cette société.
   */
  activateBoost(code: string): Observable<CompanyProfileResponse> {
    return this.http.patch<CompanyProfileResponse>(`${this.apiUrl}/${code}/boost/activate`, null);
  }
}