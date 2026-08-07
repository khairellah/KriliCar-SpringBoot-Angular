package com.kriliCar.repositories;


import com.kriliCar.entities.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    // Interface de base pour l'entité Client

    Optional<Client> findByEmail(String email);
}