package com.knust.classmate.auth;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    // A hash of the 6-digit code (via the existing PasswordEncoder), never the
    // plaintext — a leaked database must not hand out working reset codes.
    @Column(nullable = false)
    private String codeHash;

    @Column(nullable = false)
    private Instant expiresAt;

    // Set once the code is spent on a successful reset, or once the token is
    // invalidated early (superseded by a newer request, or locked out after
    // too many wrong attempts). Either way, a non-null usedAt means "not usable".
    @Column
    private Instant usedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private int attemptCount = 0;

    public PasswordResetToken() {}

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String codeHash) { this.codeHash = codeHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getUsedAt() { return usedAt; }
    public void setUsedAt(Instant usedAt) { this.usedAt = usedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public int getAttemptCount() { return attemptCount; }
    public void setAttemptCount(int attemptCount) { this.attemptCount = attemptCount; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long userId;
        private String codeHash;
        private Instant expiresAt;
        private int attemptCount = 0;

        public Builder userId(Long v) { this.userId = v; return this; }
        public Builder codeHash(String v) { this.codeHash = v; return this; }
        public Builder expiresAt(Instant v) { this.expiresAt = v; return this; }
        public Builder attemptCount(int v) { this.attemptCount = v; return this; }

        public PasswordResetToken build() {
            PasswordResetToken t = new PasswordResetToken();
            t.userId = this.userId;
            t.codeHash = this.codeHash;
            t.expiresAt = this.expiresAt;
            t.attemptCount = this.attemptCount;
            return t;
        }
    }
}
