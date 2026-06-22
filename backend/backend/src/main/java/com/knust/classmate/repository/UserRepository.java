package com.knust.classmate.repository;

import com.knust.classmate.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByIndexNumber(String indexNumber);

    Optional<User> findByReferenceNumber(String referenceNumber);

    boolean existsByEmail(String email);

    boolean existsByIndexNumber(String indexNumber);

    boolean existsByReferenceNumber(String referenceNumber);

    /**
     * Supports login by index number, reference number, or email —
     * exactly as the frontend sends a single "identifier" field.
     */
    @Query("SELECT u FROM User u WHERE u.indexNumber = :identifier " +
           "OR u.referenceNumber = :identifier " +
           "OR u.email = :identifier")
    Optional<User> findByIdentifier(@Param("identifier") String identifier);
}
