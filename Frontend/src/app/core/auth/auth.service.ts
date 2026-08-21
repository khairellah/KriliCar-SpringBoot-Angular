import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/auth/login-request.model';
import { JwtResponse } from '../models/auth/jwt-response.model';
import { ClientRegistrationRequest } from '../models/auth/client-registration-request.model';
import { ClientRegistrationResponse } from '../models/auth/client-registration-response.model';
import { CompanyRegistrationRequest } from '../models/auth/company-registration-request.model';
import { CompanyRegistrationResponse } from '../models/auth/company-registration-response.model';

import { AuthActions } from '../store/auth/auth.actions';
import {
  selectCode,
  selectEmail,
  selectIsAuthenticated,
  selectRole,
  selectToken
} from '../store/auth/auth.selectors';
import { isTokenExpired } from './jwt.util';

const TOKEN_KEY = 'krilicar_token';
const EMAIL_KEY = 'krilicar_email';
const ROLE_KEY = 'krilicar_role';
const CODE_KEY = 'krilicar_code';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly store = inject(Store);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // --- État de session (US-1.1, refactorisé US-1.4) ---
  // Source de vérité unique : le Store NgRx (core/store/auth), état
  // réellement transverse partagé entre guards, intercepteurs et features
  // (cf. §1 Spécification Frontend Angular). AuthService reste la SEULE
  // façade autorisée à dialoguer avec le Store.
  readonly token = toSignal(this.store.select(selectToken), { initialValue: null });
  readonly email = toSignal(this.store.select(selectEmail), { initialValue: null });
  readonly role = toSignal(this.store.select(selectRole), { initialValue: null });
  readonly code = toSignal(this.store.select(selectCode), { initialValue: null });
  readonly isAuthenticated = toSignal(this.store.select(selectIsAuthenticated), {
    initialValue: false
  });

  /** US-1.1 : POST /api/v1/auth/login */
  login(credentials: LoginRequest): Observable<JwtResponse> {
    return this.http
      .post<JwtResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((session) => this.openSession(session)));
  }

  /** US-1.2 : POST /api/v1/auth/register/client (multipart) — inchangé */
  registerClient(
    data: ClientRegistrationRequest,
    imageFile?: File | null
  ): Observable<ClientRegistrationResponse> {
    const formData = new FormData();
    formData.append('user', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    return this.http.post<ClientRegistrationResponse>(`${this.apiUrl}/register/client`, formData);
  }

  /** US-1.3 : POST /api/v1/auth/register/company (multipart) — inchangé */
  registerCompany(
    data: CompanyRegistrationRequest,
    imageFile?: File | null
  ): Observable<CompanyRegistrationResponse> {
    const formData = new FormData();
    formData.append('company', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    return this.http.post<CompanyRegistrationResponse>(
      `${this.apiUrl}/register/company`,
      formData
    );
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
    this.clearStorage();
  }

  /**
   * US-1.4 : réhydrate la session (token/email/rôle/code) depuis le
   * localStorage au démarrage de l'application, uniquement si le token
   * stocké est encore valide (non expiré). Appelé une seule fois via
   * `provideAppInitializer` (cf. app.config.ts), avant la première navigation.
   */
  restoreSession(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || isTokenExpired(token)) {
      this.clearStorage();
      return;
    }

    const email = localStorage.getItem(EMAIL_KEY);
    const role = localStorage.getItem(ROLE_KEY);
    const code = localStorage.getItem(CODE_KEY);
    if (!email || !role || !code) {
      this.clearStorage();
      return;
    }

    this.store.dispatch(
      AuthActions.sessionRestored({
        session: { token, email, role: role as JwtResponse['role'], code }
      })
    );
  }

  private openSession(session: JwtResponse): void {
    this.store.dispatch(AuthActions.loginSuccess({ session }));
    localStorage.setItem(TOKEN_KEY, session.token);
    localStorage.setItem(EMAIL_KEY, session.email);
    localStorage.setItem(ROLE_KEY, session.role);
    localStorage.setItem(CODE_KEY, session.code);
  }

  private clearStorage(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(CODE_KEY);
  }
}