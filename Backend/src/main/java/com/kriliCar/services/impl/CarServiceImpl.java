package com.kriliCar.services.impl;

import com.kriliCar.dtos.CarDTO;
import com.kriliCar.entities.*;
import com.kriliCar.enums.CarAvailability;
import com.kriliCar.exceptions.DuplicateResourceException;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.exceptions.UnauthorizedActionException;
import com.kriliCar.mappers.CarMapper;
import com.kriliCar.repositories.*;
import com.kriliCar.services.interfaces.CarService;
import com.kriliCar.services.interfaces.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.BadRequestException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CarServiceImpl implements CarService {

    private final CarRepository carRepository;
    private final BrandRepository brandRepository;
    private final ModelRepository modelRepository;
    private final CompanyRepository companyRepository;
    private final CarMapper carMapper;
    private final FileService fileService;

    private static final String RESOURCE_NAME = "Car";

    // KC-20 (renforcé) : whitelist stricte des types d'images acceptés.
    // Double contrôle Content-Type + extension : le Content-Type seul peut être
    // usurpé facilement (ex: Postman permet de forcer "image/png" sur un .txt),
    // donc on croise avec l'extension du nom de fichier pour limiter le contournement.
    private static final List<String> ALLOWED_IMAGE_CONTENT_TYPES = List.of(
            "image/jpeg", "image/png", "image/webp", "image/gif"
    );
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = List.of(
            ".jpg", ".jpeg", ".png", ".webp", ".gif"
    );

    // ------------------------------------------------------------------
    // createCar : US-3.1 / KC-20 + validation d'extension ajoutée
    // ------------------------------------------------------------------
    @Override
    @Transactional
    public CarDTO createCar(CarDTO carDTO, List<MultipartFile> imageFiles, Authentication authentication) throws IOException {
        if (carRepository.existsByVin(carDTO.getVin())) {
            throw new DuplicateResourceException(RESOURCE_NAME, "VIN", carDTO.getVin());
        }

        Company company = companyRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Company", "email", authentication.getName()));

        Model model = modelRepository.findByCode(carDTO.getModelCode())
                .orElseThrow(() -> new ResourceNotFoundException("Model", "code", carDTO.getModelCode()));

        if (model.getBrand() == null || !model.getBrand().getCode().equals(carDTO.getBrandCode())) {
            throw new IllegalArgumentException("Le modèle spécifié n'appartient pas à la marque fournie.");
        }

        Car car = carMapper.toEntity(carDTO);
        car.setCode("CAR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        car.setBrand(model.getBrand());
        car.setModel(model);
        car.setCompany(company);
        car.setAvailability(
                carDTO.getAvailability() == CarAvailability.MAINTENANCE
                        ? CarAvailability.MAINTENANCE
                        : CarAvailability.AVAILABLE
        );

        Car savedCar = carRepository.save(car);

        if (imageFiles != null && !imageFiles.isEmpty()) {
            List<CarImage> images = new ArrayList<>();
            for (int i = 0; i < imageFiles.size(); i++) {
                MultipartFile file = imageFiles.get(i);
                validateImageFile(file); // KC-20 : rejet des fichiers non-image
                String path = fileService.uploadFile(file, "cars");
                images.add(CarImage.builder()
                        .car(savedCar)
                        .path(path)
                        .sortOrder(i)
                        .build());
            }
            savedCar.setImages(images);
            savedCar = carRepository.save(savedCar);
        }

        return carMapper.toDTO(savedCar);
    }

    // ------------------------------------------------------------------
    // updateCar : US-3.2 — imagesToDelete par CODE + validation extension
    // ------------------------------------------------------------------
    @Override
    @Transactional
    public CarDTO updateCar(String code,
                            CarDTO carDTO,
                            List<MultipartFile> newImages,
                            List<String> imageCodesToDelete,
                            Authentication authentication) throws IOException {

        Car car = carRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Car", "code", code));

        if (!isCarOwnedByCompany(car.getId(), authentication.getName())) {
            throw new UnauthorizedActionException("Vous n'avez pas le droit de modifier cette voiture.");
        }

        if (carDTO.getMileage() != null) car.setMileage(carDTO.getMileage());
        if (carDTO.getPrice() != null) car.setPrice(carDTO.getPrice());
        if (carDTO.getDescription() != null) car.setDescription(carDTO.getDescription());
        if (carDTO.getNbrSeats() != null) car.setNbrSeats(carDTO.getNbrSeats());
        if (carDTO.getColor() != null) car.setColor(carDTO.getColor());
        if (carDTO.getYear() != null) car.setYear(carDTO.getYear());
        if (carDTO.getGearbox() != null) car.setGearbox(carDTO.getGearbox());
        if (carDTO.getFuelType() != null) car.setFuelType(carDTO.getFuelType());

        if (carDTO.getAvailability() != null) {
            if (carDTO.getAvailability() == CarAvailability.RESERVED) {
                throw new IllegalArgumentException(
                        "Le statut RESERVED ne peut pas être défini manuellement : il est piloté automatiquement par le cycle de réservation.");
            }
            car.setAvailability(carDTO.getAvailability());
        }

        if (carDTO.getVin() != null && !car.getVin().equals(carDTO.getVin())) {
            if (carRepository.existsByVin(carDTO.getVin())) {
                throw new DuplicateResourceException("Car", "VIN", carDTO.getVin());
            }
            car.setVin(carDTO.getVin());
        }

        // Suppression d'images existantes — désormais identifiées par CODE métier
        if (imageCodesToDelete != null && !imageCodesToDelete.isEmpty()) {
            List<CarImage> toRemove = car.getImages().stream()
                    .filter(img -> imageCodesToDelete.contains(img.getCode()))
                    .toList();

            if (toRemove.size() != imageCodesToDelete.size()) {
                throw new ResourceNotFoundException(
                        "Une ou plusieurs images à supprimer sont introuvables ou n'appartiennent pas à cette voiture (code voiture : " + code + ").");
            }

            for (CarImage image : toRemove) {
                fileService.deleteFile(image.getPath());
                car.getImages().remove(image);
            }
            log.info("{} image(s) supprimée(s) pour la voiture {}", toRemove.size(), code);
        }

        // Ajout de nouvelles images avec validation d'extension (KC-20)
        if (newImages != null && !newImages.isEmpty()) {
            int nextSortOrder = car.getImages().stream()
                    .map(CarImage::getSortOrder)
                    .filter(java.util.Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .map(o -> o + 1)
                    .orElse(0);

            for (MultipartFile file : newImages) {
                validateImageFile(file); // rejet des .txt/.pdf/.doc...
                String path = fileService.uploadFile(file, "cars");
                car.getImages().add(CarImage.builder()
                        .car(car)
                        .path(path)
                        .sortOrder(nextSortOrder++)
                        .build());
            }
            log.info("{} nouvelle(s) image(s) ajoutée(s) pour la voiture {}", newImages.size(), code);
        }

        Car saved = carRepository.save(car);
        return carMapper.toDTO(saved);
    }

    @Override
    @Transactional
    public void deleteCar(String code, Authentication authentication) {
        Car car = carRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Car", "code", code));

        if (!isCarOwnedByCompany(car.getId(), authentication.getName())) {
            throw new UnauthorizedActionException("Action non autorisée sur ce véhicule.");
        }

        if (car.getImages() != null && !car.getImages().isEmpty()) {
            log.info("Suppression des {} fichiers physiques pour la voiture {}", car.getImages().size(), code);
            for (CarImage image : car.getImages()) {
                fileService.deleteFile(image.getPath());
            }
        }

        carRepository.delete(car);
        log.info("Voiture {} supprimée de la base de données", code);
    }

    @Override
    @Transactional(readOnly = true)
    public CarDTO getCarByCode(String code) {
        return carRepository.findByCode(code)
                .map(carMapper::toDTO)
                .orElseThrow(() -> new ResourceNotFoundException("Car", "code", code));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CarDTO> getAllCars(String companyCode, Pageable pageable) {
        if (companyCode != null && !companyCode.isBlank()) {
            return carRepository.findByCompany_Code(companyCode, pageable).map(carMapper::toDTO);
        }
        return carRepository.findAll(pageable).map(carMapper::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isCarOwnedByCompany(Long carId, String email) {
        Company company = companyRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Company", "email", email));

        Car car = carRepository.findById(carId)
                .orElseThrow(() -> new ResourceNotFoundException(RESOURCE_NAME, "id", carId));

        return car.getCompany().getId().equals(company.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CarDTO> searchCars(String brand, String model, String city,
                                   Double minPrice, Double maxPrice,
                                   Integer minMileage, Integer maxMileage,
                                   Integer nbrSeats, Pageable pageable) throws BadRequestException {
        try {
            com.kriliCar.enums.City cityEnum = null;
            if (city != null && !city.trim().isEmpty()) {
                cityEnum = com.kriliCar.enums.City.valueOf(city.toUpperCase());
            }

            return carRepository.searchCars(
                    brand, model, cityEnum,
                    minPrice, maxPrice,
                    minMileage, maxMileage,
                    nbrSeats,
                    CarAvailability.AVAILABLE,
                    pageable
            ).map(carMapper::toDTO);

        } catch (IllegalArgumentException e) {
            throw new BadRequestException("La ville spécifiée '" + city + "' n'est pas valide.");
        } catch (Exception e) {
            log.error("ERREUR DANS LA RECHERCHE AVANCÉE : ", e);
            throw e;
        }
    }

    // ------------------------------------------------------------------
    // KC-20 : validation stricte du type de fichier image
    // ------------------------------------------------------------------
    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Fichier image vide ou manquant.");
        }

        String contentType = file.getContentType();
        String filename = file.getOriginalFilename();

        boolean validContentType = contentType != null
                && ALLOWED_IMAGE_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT));

        boolean validExtension = filename != null
                && ALLOWED_IMAGE_EXTENSIONS.stream()
                .anyMatch(ext -> filename.toLowerCase(Locale.ROOT).endsWith(ext));

        if (!validContentType || !validExtension) {
            throw new IllegalArgumentException(
                    "Fichier '" + filename + "' invalide : seules les images JPG, JPEG, PNG, WEBP ou GIF sont autorisées.");
        }
    }
}