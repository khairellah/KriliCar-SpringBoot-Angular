package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.responses.CompanyKpiDTO;
import com.kriliCar.exceptions.ResourceNotFoundException;

/**
 * US-8.2 : Calcul des KPI restreints à la Company authentifiée (§5.5 spec).
 */
public interface CompanyKpiService {

    /**
     * Agrège les indicateurs du parc de la Company identifiée par son email
     * (extrait du token JWT côté controller) : voitures par état, réservations
     * totales/validées/annulées.
     *
     * @param companyEmail email de la Company authentifiée
     */
    CompanyKpiDTO getMyKpi(String companyEmail) throws ResourceNotFoundException;
}