package com.kriliCar.controllers;

import com.kriliCar.dtos.CarDTO;
import com.kriliCar.exceptions.ResourceNotFoundException;
import com.kriliCar.services.interfaces.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<List<CarDTO>> getClientWishlist(Authentication authentication) {
        return ResponseEntity.ok(wishlistService.getClientWishlist(authentication.getName()));
    }

    @PostMapping("/{carCode}")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<CarDTO> addCarToWishlist(@PathVariable String carCode, Authentication authentication)
            throws ResourceNotFoundException {
        return new ResponseEntity<>(wishlistService.addCarToWishlist(carCode, authentication.getName()), HttpStatus.CREATED);
    }

    @DeleteMapping("/{carCode}")
    @PreAuthorize("hasAuthority('CLIENT')")
    public ResponseEntity<Void> removeCarFromWishlist(@PathVariable String carCode, Authentication authentication)
            throws ResourceNotFoundException {
        wishlistService.removeCarFromWishlist(carCode, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}