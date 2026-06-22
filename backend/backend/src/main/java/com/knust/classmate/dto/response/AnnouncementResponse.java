package com.knust.classmate.dto.response;

import com.knust.classmate.entity.Announcement;

import java.time.format.DateTimeFormatter;

public record AnnouncementResponse(
    Long id,
    String title,
    String message,
    String category,
    String targetClassGroup,
    String postedBy,
    String postedAt
) {
    private static final DateTimeFormatter FORMATTER =
        DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a");

    public static AnnouncementResponse from(Announcement a) {
        return new AnnouncementResponse(
            a.getId(),
            a.getTitle(),
            a.getMessage(),
            a.getCategory(),
            a.getTargetClassGroup(),
            a.getPostedBy(),
            a.getPostedAt() != null ? a.getPostedAt().format(FORMATTER) : ""
        );
    }
}
