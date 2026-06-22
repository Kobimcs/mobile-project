package com.knust.classmate.dto.response;

import com.knust.classmate.entity.User;

public record UserResponse(
    Long id,
    String fullName,
    String indexNumber,
    String referenceNumber,
    String email,
    String role,
    String programme,
    String level
) {
    /**
     * Maps a User entity to the shape the frontend expects.
     * Role is serialised as snake_case (e.g. "course_rep") to match
     * the frontend's UserRole type.
     */
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getFullName(),
            user.getIndexNumber(),
            user.getReferenceNumber(),
            user.getEmail(),
            user.getRole().name().toLowerCase(),   // COURSE_REP → "course_rep"
            user.getProgramme(),
            user.getLevel()
        );
    }
}
