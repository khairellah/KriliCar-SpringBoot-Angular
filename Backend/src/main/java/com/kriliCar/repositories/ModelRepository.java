package com.kriliCar.repositories;


import com.kriliCar.entities.Model;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ModelRepository extends JpaRepository<Model, Long> {
    Optional<Model> findByCode(String code);
    List<Model> findByBrandCode(String brandCode);
    Optional<Model> findByNameAndBrandCode(String name, String brandCode);
    void deleteByCode(String code);
}