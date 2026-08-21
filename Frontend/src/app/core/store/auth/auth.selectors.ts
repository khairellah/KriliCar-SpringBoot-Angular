import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectToken = createSelector(selectAuthState, (s) => s.token);
export const selectEmail = createSelector(selectAuthState, (s) => s.email);
export const selectRole = createSelector(selectAuthState, (s) => s.role);
export const selectCode = createSelector(selectAuthState, (s) => s.code);
export const selectIsAuthenticated = createSelector(selectToken, (token) => token !== null);