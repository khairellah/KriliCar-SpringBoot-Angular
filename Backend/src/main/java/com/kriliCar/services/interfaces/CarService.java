package com.kriliCar.services.interfaces;

import com.kriliCar.dtos.CarDTO;
import org.apache.coyote.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface CarService {

    CarDTO createCar(CarDTO carDTO, List<MultipartFile> imageFiles, Authentication authentication) throws IOException;

    /**
     * US-3.2 : Mise à jour d'une voiture, incluant la gestion des images.
     *
     * @param code               Code métier de la voiture
     * @param carDTO             Champs scalaires à mettre à jour (partiel)
     * @param newImages          Nouvelles images à ajouter (optionnel)
     * @param imageCodesToDelete Codes métier des images existantes à supprimer (optionnel)
     * @param authentication     Company authentifiée (ownership vérifié)
     */
    CarDTO updateCar(String code,
                     CarDTO carDTO,
                     List<MultipartFile> newImages,
                     List<String> imageCodesToDelete,
                     Authentication authentication) throws IOException;

    void deleteCar(String code, Authentication authentication);

    CarDTO getCarByCode(String code);
    // ❌ Long companyId -> ✅ String companyCode
    Page<CarDTO> getAllCars(String companyCode, Pageable pageable);
    boolean isCarOwnedByCompany(Long carId, String email);

    Page<CarDTO> searchCars(
            String brand, String model, String city,
            Double minPrice, Double maxPrice,
            Integer minMileage, Integer maxMileage,
            Integer nbrSeats, Pageable pageable
    ) throws BadRequestException;

    // US-3.4 : Recherche/filtrage restreint au parc de la Company authentifiée
    Page<CarDTO> searchMyFleet(
            String brand, String model,
            Double minPrice, Double maxPrice,
            Integer minMileage, Integer maxMileage,
            Integer nbrSeats, String availability,
            Authentication authentication, Pageable pageable
    ) throws BadRequestException;
}