package com.knust.classmate.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record VerifyResetCodeRequest(@NotBlank @Email String email, @NotBlank String code) {}
