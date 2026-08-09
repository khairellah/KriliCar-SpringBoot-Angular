package com.kriliCar.repositories;

import com.kriliCar.entities.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BrandRepository extends JpaRepository<Brand, Long> {
    Optional<Brand> findByCode(String code);
    boolean existsByName(String name);
    void deleteByCode(String code);
}