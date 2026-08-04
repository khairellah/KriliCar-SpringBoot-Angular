package com.kriliCar.controllers;

import com.kriliCar.dtos.auth.JwtResponseDTO;
import com.kriliCar.dtos.auth.LoginRequestDTO;
import com.kriliCar.entities.AppUser;
import com.kriliCar.utils.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequestDTO loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);

            String jwt = jwtUtils.generateJwtToken(authentication);

            AppUser userDetails = (AppUser) authentication.getPrincipal();
            String userRole = userDetails.getAuthorities().iterator().next().getAuthority();

            return ResponseEntity.ok(JwtResponseDTO.builder()
                    .token(jwt)
                    .email(userDetails.getUsername())
                    .role(userRole)
                    .code(userDetails.getCode())
                    .build());

        } catch (BadCredentialsException e) {
            Map<String, Object> body = new HashMap<>();
            body.put("status", HttpStatus.UNAUTHORIZED.value());
            body.put("error", "Unauthorized");
            body.put("message", "Email ou mot de passe incorrect.");
            body.put("path", "/api/v1/auth/login");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
        }
    }
}