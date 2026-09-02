// Frontend/src/app/core/models/admin/admin-kpi.model.ts
// Reflète Backend/src/main/java/com/kriliCar/dtos/responses/AdminKpiDTO.java
// Structure imbriquée par domaine (§4.6 spec), à répliquer telle quelle côté TS
// plutôt qu'à aplatir en un objet unique.
export interface CompanyKpi {
  activeCount: number;
  inactiveCount: number;
  boostedCount: number;
}

export interface ClientKpi {
  activeCount: number;
  inactiveCount: number;
}

// ⚠️ okCount regroupe déjà CONFIRMED + COMPLETED côté backend
// (AdminKpiServiceImpl.getGlobalKpi -> countByStatusIn([CONFIRMED, COMPLETED])).
// Ne jamais tenter de les re-séparer côté Frontend à partir d'un autre endpoint :
// c'est la définition officielle retenue pour ce KPI (§8 Spec Frontend).
export interface ReservationKpi {
  okCount: number;
  koCount: number;
  pendingCount: number;
}

export interface CarKpi {
  totalCount: number;
  availableCount: number;
  reservedCount: number;
  maintenanceCount: number;
}

export interface AdminKpiDTO {
  companies: CompanyKpi;
  clients: ClientKpi;
  reservations: ReservationKpi;
  wishlistTotalCount: number;
  cars: CarKpi;
}