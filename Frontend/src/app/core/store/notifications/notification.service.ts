import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { PendingReservationCount } from '../../models/reservation/pending-reservation-count.model';
import { NotificationsActions } from './notifications.actions';
import { selectPendingCount } from './notifications.selectors';

/**
 * US-5.7 : Service dédié au compteur de notifications Company (réservations
 * PENDING), aligné sur
 * Backend/src/main/java/com/kriliCar/controllers/ReservationController.java
 * (getPendingCountForCompany).
 *
 * L'état est stocké dans le Store NgRx (core/store/notifications) car c'est
 * un état transverse, potentiellement affiché sur plusieurs écrans Company
 * en même temps (cf. §1 Spec Frontend Angular) — jamais un état local de
 * composant.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);
  private readonly apiUrl = `${environment.apiUrl}/reservations`;

  /** Compteur courant de réservations PENDING pour la Company connectée. */
  readonly pendingCount = toSignal(this.store.select(selectPendingCount), { initialValue: 0 });

  /**
   * GET /api/v1/reservations/company/pending-count
   * Rôle COMPANY uniquement côté backend (@PreAuthorize). Met à jour le
   * Store à réception de la réponse.
   */
  refreshPendingCount(): Observable<PendingReservationCount> {
    return this.http
      .get<PendingReservationCount>(`${this.apiUrl}/company/pending-count`)
      .pipe(
        tap((res) =>
          this.store.dispatch(NotificationsActions.pendingCountLoaded({ count: res.pendingCount }))
        )
      );
  }
}