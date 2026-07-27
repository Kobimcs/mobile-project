package com.knust.classmate.auth;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// Same base path as AuthController — these are unauthenticated by design (see
// SecurityConfig): a user resetting their password is, by definition, not
// logged in.
@RestController
@RequestMapping("/auth")
public class PasswordResetController {

    // Identical wording every time, regardless of whether the email exists,
    // was rate-limited, or the send failed — see PasswordResetService.requestReset().
    private static final String RESET_REQUESTED_MESSAGE = "If an account exists for that email, we've sent a code.";

    private final PasswordResetService passwordResetService;

    @Autowired
    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request.email());
        return ResponseEntity.ok(Map.of("message", RESET_REQUESTED_MESSAGE));
    }

    @PostMapping("/verify-reset-code")
    public ResponseEntity<Map<String, String>> verifyResetCode(@Valid @RequestBody VerifyResetCodeRequest request) {
        passwordResetService.verifyCode(request.email(), request.code());
        return ResponseEntity.ok(Map.of("message", "Code verified."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.email(), request.code(), request.newPassword());
        return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
    }
}
