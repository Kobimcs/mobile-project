package com.knust.classmate.controller;

import com.knust.classmate.dto.request.LoginRequest;
import com.knust.classmate.dto.request.RegisterRequest;
import com.knust.classmate.dto.response.LoginResponse;
import com.knust.classmate.dto.response.UserResponse;
import com.knust.classmate.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/register
     * Registers a new student account.
     * Returns 201 Created on success — the frontend checks response.ok which is
     * true for any 2xx status.
     */
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse user = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    /**
     * POST /api/auth/login
     * Authenticates a user by index number, reference number, or email + password.
     * Returns { token, user } exactly as expected by the frontend LoginResponse type.
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
