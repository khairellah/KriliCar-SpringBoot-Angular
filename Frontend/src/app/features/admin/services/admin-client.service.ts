// Frontend/src/app/features/admin/services/admin-client.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ClientAdminSummaryDTO } from '../../../core/models/admin/client-admin-summary.model';

/**
 * Service Admin dédié aux clients, aligné 1-pour-1 sur
 * Backend/src/main/java/com/kriliCar/controllers/AdminClientController.java
 * (@PreAuthorize("hasAuthority('ADMIN')") côté backend).
 *
 * US-7.3 : getClients() — liste filtrable (active)
 *
 * ⚠️ Périmètre : l'activation/désactivation (US-7.4) et le détail complet
 * (US-7.5) restent hors périmètre de ce service pour l'instant — à compléter
 * lors de ces US ultérieures, sans jamais dupliquer ce fichier.
 */
@Injectable({ providedIn: 'root' })
export class AdminClientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admins/clients`;

  /**
   * US-7.3 : GET /api/v1/admins/clients?active=
   *
   * Filtre optionnel unique. `undefined` = paramètre omis (jamais envoyé
   * comme "active=null" en query string), conformément à la règle UI §4.4
   * Spec Frontend : "Tous" -> paramètre omis, "Oui" -> true, "Non" -> false.
   */
  getClients(active?: boolean): Observable<ClientAdminSummaryDTO[]> {
    let params = new HttpParams();
    if (active !== undefined) {
      params = params.set('active', active);
    }
    return this.http.get<ClientAdminSummaryDTO[]>(this.apiUrl, { params });
  }
}