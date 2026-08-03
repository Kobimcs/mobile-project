package com.knust.classmate.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByIndexNumber(String indexNumber);

    List<User> findByRole(UserRole role);

    List<User> findByClassGroup(String classGroup);

    boolean existsByEmail(String email);
    boolean existsByIndexNumber(String indexNumber);
    boolean existsByReferenceNumber(String referenceNumber);

    // Case-insensitive so a user can sign in regardless of how they type their
    // email, index number or reference number (stored normalized at registration).
    @Query("SELECT u FROM User u WHERE LOWER(u.indexNumber) = LOWER(:identifier) " +
           "OR LOWER(u.referenceNumber) = LOWER(:identifier) OR LOWER(u.email) = LOWER(:identifier)")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);
}
