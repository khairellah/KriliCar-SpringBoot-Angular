package com.kriliCar.repositories;


import com.kriliCar.entities.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    // Interface de base pour l'entité Company
    Optional<Company> findById(Long id); // Si vous utilisez déjà cette méthode
    Optional<Company> findByEmail(String email);

    // --- US-6.2 : Gestion Admin du Boost ---
    Optional<Company> findByCode(String code);
    List<Company> findByBoostRequestedTrue();

    // --- US-7.1 : Liste des sociétés avec filtres combinables (Admin) ---
    // Filtres optionnels : si un paramètre est null, il est ignoré (pas de restriction).
    @Query("SELECT c FROM Company c WHERE " +
            "(:active IS NULL OR c.active = :active) AND " +
            "(:boosted IS NULL OR c.isBooster = :boosted) " +
            "ORDER BY c.createdAt DESC")
    List<Company> findCompaniesByFilters(
            @Param("active") Boolean active,
            @Param("boosted") Boolean boosted
    );

    // --- US-8.1 : KPI globaux Admin ---
    long countByActive(Boolean active);
    long countByIsBooster(Boolean isBooster);
}