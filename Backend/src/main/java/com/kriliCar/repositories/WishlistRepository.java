package com.kriliCar.repositories;

import com.kriliCar.entities.Car;
import com.kriliCar.entities.Client;
import com.kriliCar.entities.WishList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<WishList, Long> {
    // 1. Pour GET /wishlist : Récupère toutes les entrées pour un client
    List<WishList> findByClientId(Long clientId);
    // 2. Pour POST /wishlist/{carId} : Vérification d'unicité
    boolean existsByClientAndCar(Client client, Car car);
    // 3. Pour DELETE /wishlist/{carId} : Trouver l'entrée spécifique
    Optional<WishList> findByClientAndCar(Client client, Car car);
}