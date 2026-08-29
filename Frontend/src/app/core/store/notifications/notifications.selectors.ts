import { createFeatureSelector, createSelector } from '@ngrx/store';
import { NotificationsState } from './notifications.state';

export const selectNotificationsState =
  createFeatureSelector<NotificationsState>('notifications');

export const selectPendingCount = createSelector(
  selectNotificationsState,
  (state) => state.pendingCount
);