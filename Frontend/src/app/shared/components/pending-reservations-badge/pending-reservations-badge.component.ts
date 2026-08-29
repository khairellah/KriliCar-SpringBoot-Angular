import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith, switchMap } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/store/notifications/notification.service';

/** US-5.7 : intervalle de rafraîchissement du badge (polling RxJS, §1 Spec Frontend). */
const POLL_INTERVAL_MS = 60000;

/**
 * US-5.7 : Badge affichant le nombre de réservations PENDING en attente de
 * traitement par la Company connectée. Composant réutilisable, destiné à
 * terme au header/layout (non encore développé, cf. `layout/`) ; intégré
 * pour l'instant directement sur l'écran "Réservations reçues".
 *
 * N'interroge le backend que pour un utilisateur COMPANY connecté, le
 * endpoint étant protégé @PreAuthorize("hasAuthority('COMPANY')").
 */
@Component({
  selector: 'app-pending-reservations-badge',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatBadgeModule, MatButtonModule],
  templateUrl: './pending-reservations-badge.component.html',
  styleUrl: './pending-reservations-badge.component.scss'
})
export class PendingReservationsBadgeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly pendingCount = this.notificationService.pendingCount;

  ngOnInit(): void {
    if (this.authService.role() !== 'COMPANY') {
      return;
    }

    // Polling RxJS : premier appel immédiat (startWith(0)), puis toutes les
    // 60s. S'arrête automatiquement à la destruction du composant.
    interval(POLL_INTERVAL_MS)
      .pipe(
        startWith(0),
        switchMap(() => this.notificationService.refreshPendingCount()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({ error: () => {} }); // échec silencieux : le badge garde sa dernière valeur connue
  }
}