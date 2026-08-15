package com.kriliCar.repositories;


import com.kriliCar.entities.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    // Interface de base pour l'entité Client

    Optional<Client> findByEmail(String email);

    // --- US-7.3 : Liste des clients avec filtre optionnel sur le statut du compte ---
    @Query("SELECT c FROM Client c WHERE " +
            "(:active IS NULL OR c.active = :active) " +
            "ORDER BY c.createdAt DESC")
    List<Client> findClientsByFilter(@Param("active") Boolean active);

    // --- US-7.4 : nécessaire pour l'activation/désactivation par l'Admin ---
    Optional<Client> findByCode(String code);

    // --- US-8.1 : KPI globaux Admin ---
    long countByActive(Boolean active);
}