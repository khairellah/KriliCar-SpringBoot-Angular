import { createActionGroup, props } from '@ngrx/store';

/**
 * US-5.7 : Actions du Store NgRx "notifications" — état transverse du
 * compteur de réservations PENDING (Company), potentiellement affiché sur
 * plusieurs écrans simultanément (cf. §1 Spécification Frontend Angular).
 */
export const NotificationsActions = createActionGroup({
  source: 'Notifications',
  events: {
    /** Résultat de GET /api/v1/reservations/company/pending-count. */
    'Pending Count Loaded': props<{ count: number }>()
  }
});