package com.knust.classmate.entity;

import com.knust.classmate.enums.UserRole;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(unique = true)
    private String indexNumber;

    @Column(unique = true)
    private String referenceNumber;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column
    private String programme;

    @Column
    private String level;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role = UserRole.STUDENT;

    /**
     * ACTIVE — can login normally
     * PENDING — course rep waiting for admin approval
     * REJECTED — course rep request was rejected
     */
    @Column(nullable = false)
    private String status = "ACTIVE";

    @Column(nullable = false)
    private boolean enabled = true;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public User() {}

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getIndexNumber() { return indexNumber; }
    public void setIndexNumber(String indexNumber) { this.indexNumber = indexNumber; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getProgramme() { return programme; }
    public void setProgramme(String programme) { this.programme = programme; }
    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }
    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String fullName, indexNumber, referenceNumber, email, password;
        private String programme, level, status = "ACTIVE";
        private UserRole role = UserRole.STUDENT;
        private boolean enabled = true;

        public Builder fullName(String v) { this.fullName = v; return this; }
        public Builder indexNumber(String v) { this.indexNumber = v; return this; }
        public Builder referenceNumber(String v) { this.referenceNumber = v; return this; }
        public Builder email(String v) { this.email = v; return this; }
        public Builder password(String v) { this.password = v; return this; }
        public Builder programme(String v) { this.programme = v; return this; }
        public Builder level(String v) { this.level = v; return this; }
        public Builder role(UserRole v) { this.role = v; return this; }
        public Builder status(String v) { this.status = v; return this; }
        public Builder enabled(boolean v) { this.enabled = v; return this; }

        public User build() {
            User u = new User();
            u.fullName = this.fullName;
            u.indexNumber = this.indexNumber;
            u.referenceNumber = this.referenceNumber;
            u.email = this.email;
            u.password = this.password;
            u.programme = this.programme;
            u.level = this.level;
            u.role = this.role;
            u.status = this.status;
            u.enabled = this.enabled;
            return u;
        }
    }
}