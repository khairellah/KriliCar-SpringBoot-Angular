import { FieldError } from './field-error.model';

// Reflète Backend/src/main/java/com/kriliCar/dtos/responses/ErrorResponse.java
// `errors` n'est peuplé que pour les erreurs de validation (400) ;
// absent/null pour les autres codes (404, 409, 500...).
export interface ErrorResponse {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp?: string;
  errors?: FieldError[];
}