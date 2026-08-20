// Reflète la structure des corps d'erreur renvoyés manuellement par
// AuthController.authenticateUser() (401 BadCredentialsException / 403 DisabledException)
export interface AuthErrorResponse {
  status: number;
  error: string;
  message: string;
  path: string;
}