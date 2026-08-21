import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard } from './auth.guard';
import { AuthService } from '../auth/auth.service';

function buildFakeToken(exp: number): string {
  const base64url = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'HS512' })}.${base64url({ sub: 'a@b.com', roles: 'CLIENT', exp })}.sig`;
}

describe('authGuard', () => {
  let authServiceMock: { token: ReturnType<typeof signal<string | null>>; logout: () => void };
  let logoutCalls = 0;

  beforeEach(() => {
    logoutCalls = 0;
    authServiceMock = {
      token: signal<string | null>(null),
      logout: () => {
        logoutCalls++;
      }
    };
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }]
    });
  });

  const runGuard = () => TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

  it('redirige vers /login si aucun token', () => {
    expect(runGuard()).not.toBe(true);
  });

  it('autorise l\'accès si le token est valide et non expiré', () => {
    authServiceMock.token.set(buildFakeToken(Math.floor(Date.now() / 1000) + 3600));
    expect(runGuard()).toBe(true);
  });

  it('déconnecte et redirige si le token est expiré', () => {
    authServiceMock.token.set(buildFakeToken(Math.floor(Date.now() / 1000) - 3600));
    expect(runGuard()).not.toBe(true);
    expect(logoutCalls).toBe(1);
  });
});