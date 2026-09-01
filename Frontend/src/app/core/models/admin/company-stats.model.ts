// Reflète Backend/src/main/java/com/kriliCar/dtos/responses/CompanyStatsDTO.java
export interface CompanyStatsDTO {
  totalCars: number;
  availableCars: number;
  maintenanceCars: number;
  reservedCars: number;
  totalReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  cancelledReservations: number;
  completedReservations: number;
}