// Frontend/src/app/core/models/company/company-kpi.model.ts
import { CarKpi } from '../admin/admin-kpi.model';

// Reflète Backend/src/main/java/com/kriliCar/dtos/responses/CompanyKpiDTO.java
// `cars` réutilise la même forme que AdminKpiDTO.CarKpi (factorisation suggérée
// par le commentaire Javadoc du DTO backend) : totalCount/availableCount/
// reservedCount/maintenanceCount.
export interface CompanyReservationKpi {
  totalCount: number;
  validatedCount: number; // CONFIRMED
  cancelledCount: number; // CANCELLED
}

export interface CompanyKpiDTO {
  cars: CarKpi;
  reservations: CompanyReservationKpi;
}