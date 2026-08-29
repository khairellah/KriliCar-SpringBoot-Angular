import { createReducer, on } from '@ngrx/store';
import { AuthActions } from '../auth/auth.actions';
import { NotificationsActions } from './notifications.actions';
import { NotificationsState, initialNotificationsState } from './notifications.state';

export const notificationsReducer = createReducer(
  initialNotificationsState,
  on(
    NotificationsActions.pendingCountLoaded,
    (state, { count }): NotificationsState => ({ ...state, pendingCount: count })
  ),
  // Le compteur n'a plus de sens hors session Company connectée.
  on(AuthActions.logout, (): NotificationsState => initialNotificationsState)
);