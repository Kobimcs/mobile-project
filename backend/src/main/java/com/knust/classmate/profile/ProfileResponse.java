package com.knust.classmate.profile;

import com.knust.classmate.user.User;

// Never exposes the password hash — only the fields the profile screen needs.
public record ProfileResponse(
    Long id,
    String fullName,
    String email,
    String studentIndexNumber,
    String phone,
    String bio,
    String programme,
    String level,
    String classGroup,
    String avatarUrl
) {
    public static ProfileResponse from(User user) {
        return new ProfileResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getIndexNumber(),
            user.getPhone(),
            user.getBio(),
            user.getProgramme(),
            user.getLevel(),
            user.getClassGroup(),
            user.getAvatarUrl()
        );
    }
}
