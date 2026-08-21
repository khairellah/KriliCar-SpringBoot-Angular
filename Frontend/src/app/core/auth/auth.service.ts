import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginRequest } from '../models/auth/login-request.model';
import { JwtResponse } from '../models/auth/jwt-response.model';
import { ClientRegistrationRequest } from '../models/auth/client-registration-request.model';
import { ClientRegistrationResponse } from '../models/auth/client-registration-response.model';
import { CompanyRegistrationRequest } from '../models/auth/company-registration-request.model';
import { CompanyRegistrationResponse } from '../models/auth/company-registration-response.model';

import { Role } from '../models/enums';

const TOKEN_KEY = 'krilicar_token';
const EMAIL_KEY = 'krilicar_email';
const ROLE_KEY = 'krilicar_role';
const CODE_KEY = 'krilicar_code';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // --- État de session (US-1.1) ---
  // NOTE ARCHITECTURE : socle basé sur des Signals, singleton via providedIn: 'root'.
  // Sera enveloppé dans le Store NgRx (core/store) dès qu'un état réellement
  // transverse à plusieurs features sera nécessaire (guards, intercepteur JWT,
  // badge de notifications Company) - cf. §1 Spécification Frontend Angular.
  private readonly _token = signal<string | null>(this.readStorage(TOKEN_KEY));
  private readonly _email = signal<string | null>(this.readStorage(EMAIL_KEY));
  private readonly _role = signal<Role | null>(this.readStorage(ROLE_KEY) as Role | null);
  private readonly _code = signal<string | null>(this.readStorage(CODE_KEY));

  readonly token = this._token.asReadonly();
  readonly email = this._email.asReadonly();
  readonly role = this._role.asReadonly();
  readonly code = this._code.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);

  /**
   * US-1.1 : POST /api/v1/auth/login
   * Stocke la session (token/email/role/code) en cas de succès.
   */
  login(credentials: LoginRequest): Observable<JwtResponse> {
    return this.http
      .post<JwtResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(tap((response) => this.setSession(response)));
  }

  /**
   * US-1.2 : POST /api/v1/auth/register/client (multipart/form-data)
   *
   * ⚠️ Le contrôleur backend attend la partie JSON sous le nom "user"
   * (AuthController#registerClient -> @RequestPart("user")), pas "client".
   * Aucune session n'est ouverte ici : le Client doit ensuite se connecter
   * via /login (pas d'auto-login prévu par la spec).
   */
  registerClient(
    data: ClientRegistrationRequest,
    imageFile?: File | null
  ): Observable<ClientRegistrationResponse> {
    const formData = new FormData();
    formData.append(
      'user',
      new Blob([JSON.stringify(data)], { type: 'application/json' })
    );
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    return this.http.post<ClientRegistrationResponse>(
      `${this.apiUrl}/register/client`,
      formData
    );
  }

  /**
   * US-1.3 : POST /api/v1/auth/register/company (multipart/form-data)
   *
   * ⚠️ Le contrôleur backend attend la partie JSON sous le nom "company"
   * (AuthController#registerCompany -> @RequestPart("company")), différent de "user"
   * utilisé pour le Client. Aucune session n'est ouverte ici (pas d'auto-login).
   */
  registerCompany(
    data: CompanyRegistrationRequest,
    imageFile?: File | null
  ): Observable<CompanyRegistrationResponse> {
    const formData = new FormData();
    formData.append(
      'company',
      new Blob([JSON.stringify(data)], { type: 'application/json' })
    );
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }
    return this.http.post<CompanyRegistrationResponse>(
      `${this.apiUrl}/register/company`,
      formData
    );
  }

  logout(): void {
    this._token.set(null);
    this._email.set(null);
    this._role.set(null);
    this._code.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(CODE_KEY);
  }

  private setSession(response: JwtResponse): void {
    this._token.set(response.token);
    this._email.set(response.email);
    this._role.set(response.role);
    this._code.set(response.code);

    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(EMAIL_KEY, response.email);
    localStorage.setItem(ROLE_KEY, response.role);
    localStorage.setItem(CODE_KEY, response.code);
  }

  private readStorage(key: string): string | null {
    return localStorage.getItem(key);
  }
}