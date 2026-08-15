package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.responses.AdminKpiDTO;

/**
 * US-8.1 : Calcul des KPI globaux de la plateforme (vue Admin).
 */
public interface AdminKpiService {

    /**
     * Agrège l'ensemble des indicateurs plateforme définis en §4.6 de la spec :
     * sociétés (actives/inactives/boostées), clients (actifs/inactifs),
     * réservations (OK/KO/PENDING), wishlist (total), voitures (par état).
     */
    AdminKpiDTO getGlobalKpi();
}