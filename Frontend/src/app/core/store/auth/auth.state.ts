import { Role } from '../../models/enums';

export interface AuthState {
  token: string | null;
  email: string | null;
  role: Role | null;
  code: string | null;
}

export const initialAuthState: AuthState = {
  token: null,
  email: null,
  role: null,
  code: null
};