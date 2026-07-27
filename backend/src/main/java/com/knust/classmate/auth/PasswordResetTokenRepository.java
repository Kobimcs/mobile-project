package com.knust.classmate.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    List<PasswordResetToken> findByUserIdAndUsedAtIsNull(Long userId);
}
