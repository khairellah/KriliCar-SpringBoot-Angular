// Reflète la structure JSON standard d'un org.springframework.data.domain.Page<T>
// (utilisé par GET /api/v1/cars — CarController.getAllCars(Pageable pageable)).
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // index de la page courante (0-based)
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}