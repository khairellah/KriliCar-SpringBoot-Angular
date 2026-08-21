import { decodeJwt, isTokenExpired } from './jwt.util';

function buildFakeToken(payload: Record<string, unknown>): string {
  const base64url = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'HS512', typ: 'JWT' })}.${base64url(payload)}.fake-signature`;
}

describe('jwt.util', () => {
  describe('decodeJwt', () => {
    it("décode correctement le payload d'un token valide", () => {
      const token = buildFakeToken({ sub: 'admin@krili.com', roles: 'ADMIN', exp: 9999999999 });
      const payload = decodeJwt(token);
      expect(payload?.sub).toBe('admin@krili.com');
      expect(payload?.roles).toBe('ADMIN');
    });

    it('retourne null pour un token malformé', () => {
      expect(decodeJwt('pas-un-token')).toBeNull();
    });

    it('retourne null pour une chaîne vide', () => {
      expect(decodeJwt('')).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it("retourne false pour un token dont l'expiration est future", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = buildFakeToken({ sub: 'a@b.com', roles: 'CLIENT', exp: futureExp });
      expect(isTokenExpired(token)).toBe(false);
    });

    it('retourne true pour un token expiré', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600;
      const token = buildFakeToken({ sub: 'a@b.com', roles: 'CLIENT', exp: pastExp });
      expect(isTokenExpired(token)).toBe(true);
    });

    it('retourne true pour un token indécodable', () => {
      expect(isTokenExpired('invalide')).toBe(true);
    });
  });
});