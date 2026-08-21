/**
 * Utilitaires de décodage JWT (payload uniquement, aucune vérification de
 * signature côté client — la validation cryptographique reste du ressort
 * exclusif du backend, cf. JwtAuthTokenFilter). Sert uniquement à lire les
 * informations non sensibles nécessaires aux guards/intercepteurs : rôle et
 * date d'expiration.
 *
 * Reflète la structure des claims émis par
 * Backend/src/main/java/com/kriliCar/utils/JwtUtils.java :
 * - sub   : email de l'utilisateur (setSubject)
 * - roles : rôle unique de l'utilisateur, ex. "ADMIN" (claim("roles", roles))
 * - iat   : date d'émission (timestamp en secondes)
 * - exp   : date d'expiration (timestamp en secondes)
 */
export interface JwtPayload {
  sub: string;
  roles: string;
  iat: number;
  exp: number;
}

/**
 * Décode la partie payload d'un JWT (base64url) sans vérifier sa signature.
 * Retourne `null` si le token est malformé.
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payloadSegment = token.split('.')[1];
    if (!payloadSegment) {
      return null;
    }
    let base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Indique si un token est expiré (ou invalide/indécodable, considéré comme
 * expiré par prudence). Comparaison basée sur la claim `exp` (secondes),
 * jamais sur une donnée mise en cache côté client (cf. §7 Spec Frontend).
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload?.exp) {
    return true;
  }
  return Date.now() >= payload.exp * 1000;
}