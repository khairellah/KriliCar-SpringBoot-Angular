import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { roleGuard } from './role.guard';
import { AuthService } from '../auth/auth.service';

function buildFakeToken(roles: string, exp: number): string {
  const base64url = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'HS512' })}.${base64url({ sub: 'a@b.com', roles, exp })}.sig`;
}

describe('roleGuard', () => {
  let authServiceMock: { token: ReturnType<typeof signal<string | null>> };
  const future = Math.floor(Date.now() / 1000) + 3600;

  beforeEach(() => {
    authServiceMock = { token: signal<string | null>(null) };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }]
    });
  });

  const runGuard = (roles: Array<'ADMIN' | 'COMPANY' | 'CLIENT'>) =>
    TestBed.runInInjectionContext(() => roleGuard(...roles)({} as any, {} as any));

  it('autorise l\'accès si le rôle du token correspond', () => {
    authServiceMock.token.set(buildFakeToken('COMPANY', future));
    expect(runGuard(['COMPANY'])).toBe(true);
  });

  it('redirige vers /forbidden si le rôle ne correspond pas', () => {
    authServiceMock.token.set(buildFakeToken('CLIENT', future));
    expect(runGuard(['ADMIN'])).not.toBe(true);
  });

  it('redirige vers /login si aucun token', () => {
    expect(runGuard(['ADMIN'])).not.toBe(true);
  });
});