package com.knust.classmate.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank(message = "Full name is required")
        String fullName,

        @NotBlank(message = "Index number is required")
        String indexNumber,

        @NotBlank(message = "Reference number is required")
        String referenceNumber,

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email address")
        String email,

        @NotBlank(message = "Programme is required")
        String programme,

        @NotBlank(message = "Level is required")
        String level,

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        String password,

        // Optional — defaults to STUDENT if not provided
        String role
) {}