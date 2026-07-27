package com.knust.classmate.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// newPassword validation mirrors RegisterRequest's rule exactly (min 6) — the
// same password policy the rest of the app already enforces at signup.
public record ResetPasswordRequest(
    @NotBlank @Email String email,
    @NotBlank String code,
    @NotBlank @Size(min = 6) String newPassword
) {}
