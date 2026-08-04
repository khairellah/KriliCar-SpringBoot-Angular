package com.kriliCar.repositories;


import com.kriliCar.entities.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {
    // Interface de base pour l'entité Company
    Optional<Company> findById(Long id); // Si vous utilisez déjà cette méthode
    Optional<Company> findByEmail(String email);
}