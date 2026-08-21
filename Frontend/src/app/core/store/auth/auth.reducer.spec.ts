import { authReducer } from './auth.reducer';
import { AuthActions } from './auth.actions';
import { initialAuthState } from './auth.state';
import { JwtResponse } from '../../models/auth/jwt-response.model';

const fakeSession: JwtResponse = {
  token: 'fake-token',
  email: 'client@krili.com',
  role: 'CLIENT',
  code: 'CLIENT-CODE-1'
};

describe('authReducer', () => {
  it("retourne l'état initial par défaut", () => {
    const state = authReducer(undefined, { type: '@@INIT' } as any);
    expect(state).toEqual(initialAuthState);
  });

  it('renseigne la session sur loginSuccess', () => {
    const state = authReducer(
      initialAuthState,
      AuthActions.loginSuccess({ session: fakeSession })
    );
    expect(state.token).toBe('fake-token');
    expect(state.role).toBe('CLIENT');
    expect(state.code).toBe('CLIENT-CODE-1');
  });

  it("réinitialise l'état sur logout", () => {
    const loggedIn = authReducer(
      initialAuthState,
      AuthActions.loginSuccess({ session: fakeSession })
    );
    const state = authReducer(loggedIn, AuthActions.logout());
    expect(state).toEqual(initialAuthState);
  });
});