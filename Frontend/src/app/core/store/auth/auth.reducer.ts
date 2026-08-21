import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { AuthState, initialAuthState } from './auth.state';

export const authReducer = createReducer(
  initialAuthState,
  on(
    AuthActions.loginSuccess,
    AuthActions.sessionRestored,
    (state, { session }): AuthState => ({
      ...state,
      token: session.token,
      email: session.email,
      role: session.role,
      code: session.code
    })
  ),
  on(AuthActions.logout, (): AuthState => initialAuthState)
);