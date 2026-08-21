import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { JwtResponse } from '../../models/auth/jwt-response.model';

/**
 * Actions du Store NgRx "auth" — état global de la session utilisateur
 * (token JWT, email, rôle, code), partagé entre guards, intercepteurs et
 * toutes les features (cf. §1 Spécification Frontend Angular).
 */
export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    /** US-1.1 : session ouverte suite à un login réussi. */
    'Login Success': props<{ session: JwtResponse }>(),
    /** US-1.4 : session réhydratée depuis le localStorage au démarrage de l'app. */
    'Session Restored': props<{ session: JwtResponse }>(),
    /** Déconnexion explicite, ou forcée par l'error.interceptor sur un 401. */
    Logout: emptyProps()
  }
});