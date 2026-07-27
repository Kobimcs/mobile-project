package com.knust.classmate.auth;

import com.knust.classmate.audit.AuditService;
import com.knust.classmate.email.EmailService;
import com.knust.classmate.exception.ApiException;
import com.knust.classmate.user.User;
import com.knust.classmate.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class PasswordResetService {

    private static final Logger log = LoggerFactory.getLogger(PasswordResetService.class);

    private static final long EXPIRY_MINUTES = 15;
    private static final int MAX_ATTEMPTS = 5;
    // Deliberately identical for every failure reason (no such account, no
    // token, expired, already used, locked out, wrong code) — distinguishing
    // any of these to the caller would help an attacker.
    private static final String GENERIC_INVALID_CODE = "Invalid or expired code.";

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final PasswordResetRateLimiter rateLimiter;
    private final AuditService auditService;

    @Autowired
    public PasswordResetService(PasswordResetTokenRepository tokenRepository, UserRepository userRepository,
                                PasswordEncoder passwordEncoder, EmailService emailService,
                                PasswordResetRateLimiter rateLimiter, AuditService auditService) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.rateLimiter = rateLimiter;
        this.auditService = auditService;
    }

    /**
     * Always completes with no visible signal to the caller about whether the
     * email exists, whether it was rate-limited, or whether sending the email
     * failed — all three are handled internally and produce an identical
     * outcome, so none of them can be used to enumerate accounts.
     */
    @Transactional
    public void requestReset(String rawEmail) {
        String email = normalizeEmail(rawEmail);

        if (!rateLimiter.tryConsume(email)) {
            log.info("Password reset request rate-limited");
            return;
        }

        userRepository.findByEmail(email).ifPresent(user -> {
            try {
                invalidateExistingTokens(user.getId());

                String code = generateCode();
                PasswordResetToken token = PasswordResetToken.builder()
                    .userId(user.getId())
                    .codeHash(passwordEncoder.encode(code))
                    .expiresAt(Instant.now().plus(EXPIRY_MINUTES, ChronoUnit.MINUTES))
                    .attemptCount(0)
                    .build();
                tokenRepository.save(token);

                emailService.sendPasswordResetCode(user.getEmail(), code);

                auditService.log("PASSWORD_RESET_REQUESTED", "Reset code emailed",
                    user.getFullName(), user.getRole().name());
            } catch (Exception e) {
                // A send failure (or anything else) must not surface differently
                // than "no such account" — log it, but don't let it escape.
                log.error("Failed to process password reset request", e);
            }
        });
    }

    /** Checks the code without consuming it, so the UI can say "wrong code" before asking for a new password. */
    @Transactional
    public void verifyCode(String rawEmail, String code) {
        User user = requireUser(rawEmail);
        validateCode(user, code);
    }

    /**
     * Re-validates the code from scratch — never assumes verifyCode() was
     * already called, since the client controls call order.
     */
    @Transactional
    public void resetPassword(String rawEmail, String code, String newPassword) {
        User user = requireUser(rawEmail);
        PasswordResetToken token = validateCode(user, code);

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsedAt(Instant.now());
        tokenRepository.save(token);

        auditService.log("PASSWORD_RESET_COMPLETED", "Password reset via emailed code",
            user.getFullName(), user.getRole().name());
    }

    private User requireUser(String rawEmail) {
        return userRepository.findByEmail(normalizeEmail(rawEmail))
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, GENERIC_INVALID_CODE));
    }

    // Shared by verifyCode and resetPassword so attempt-counting can't be
    // doubled up by calling both endpoints against the same token.
    private PasswordResetToken validateCode(User user, String code) {
        PasswordResetToken token = tokenRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, GENERIC_INVALID_CODE));

        boolean alreadyInvalid = token.getUsedAt() != null
            || token.getExpiresAt().isBefore(Instant.now())
            || token.getAttemptCount() >= MAX_ATTEMPTS;
        if (alreadyInvalid) {
            throw new ApiException(HttpStatus.BAD_REQUEST, GENERIC_INVALID_CODE);
        }

        if (!passwordEncoder.matches(code, token.getCodeHash())) {
            token.setAttemptCount(token.getAttemptCount() + 1);
            if (token.getAttemptCount() >= MAX_ATTEMPTS) {
                // A 6-digit code is only a million possibilities — this hard
                // cutoff is what makes that safe against brute-forcing.
                token.setUsedAt(Instant.now());
            }
            tokenRepository.save(token);
            throw new ApiException(HttpStatus.BAD_REQUEST, GENERIC_INVALID_CODE);
        }

        return token;
    }

    private void invalidateExistingTokens(Long userId) {
        Instant now = Instant.now();
        tokenRepository.findByUserIdAndUsedAtIsNull(userId).forEach(t -> {
            t.setUsedAt(now);
            tokenRepository.save(t);
        });
    }

    private String generateCode() {
        return String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
