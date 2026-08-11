package com.kriliCar.services.impl;

import com.kriliCar.dtos.CarDTO;
import com.kriliCar.entities.AppUser;
import com.kriliCar.entities.Car;
import com.kriliCar.entities.Client;
import com.kriliCar.entities.WishList;
import com.kriliCar.exceptions.DuplicateResourceException;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.mappers.CarMapper;
import com.kriliCar.repositories.AppUserRepository;
import com.kriliCar.repositories.CarRepository;
import com.kriliCar.repositories.WishlistRepository;
import com.kriliCar.services.interfaces.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final AppUserRepository appUserRepository;
    private final CarRepository carRepository;
    private final WishlistRepository wishlistRepository;
    private final CarMapper carMapper;

    private Client findClientByEmail(String userEmail) {
        AppUser appUser = appUserRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", userEmail));

        if (!(appUser instanceof Client)) {
            throw new ResourceNotFoundException("Client", "email", userEmail + " (non ROLE_CLIENT)");
        }
        return (Client) appUser;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CarDTO> getClientWishlist(String userEmail) {
        Client client = findClientByEmail(userEmail);
        List<WishList> wishlistEntries = wishlistRepository.findByClientId(client.getId());

        return wishlistEntries.stream()
                .map(WishList::getCar)
                .map(carMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public CarDTO addCarToWishlist(String carCode, String userEmail) throws ResourceNotFoundException {
        Client client = findClientByEmail(userEmail);

        Car car = carRepository.findByCode(carCode)
                .orElseThrow(() -> new ResourceNotFoundException("Car", "code", carCode));

        if (wishlistRepository.existsByClientAndCar(client, car)) {
            throw new DuplicateResourceException("WishList", "carCode", carCode + " (déjà ajoutée)");
        }

        WishList newEntry = WishList.builder()
                .client(client)
                .car(car)
                .build();

        wishlistRepository.save(newEntry);
        return carMapper.toDTO(car);
    }

    @Override
    @Transactional
    public void removeCarFromWishlist(String carCode, String userEmail) throws ResourceNotFoundException {
        Client client = findClientByEmail(userEmail);

        Car car = carRepository.findByCode(carCode)
                .orElseThrow(() -> new ResourceNotFoundException("Car", "code", carCode));

        WishList entryToDelete = wishlistRepository.findByClientAndCar(client, car)
                .orElseThrow(() -> new ResourceNotFoundException("WishList Entry", "carCode", carCode));

        wishlistRepository.delete(entryToDelete);
    }
}