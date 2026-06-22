package com.knust.classmate.dto.request;

import jakarta.validation.constraints.NotBlank;

public record TimetableRequest(

    @NotBlank(message = "Course code is required")
    String courseCode,

    @NotBlank(message = "Course title is required")
    String courseTitle,

    @NotBlank(message = "Day of week is required")
    String dayOfWeek,

    @NotBlank(message = "Start time is required")
    String startTime,

    @NotBlank(message = "End time is required")
    String endTime,

    @NotBlank(message = "Venue is required")
    String venue,

    String lecturer,
    String classGroup,

    // Status: active | venue_changed | time_changed | cancelled
    String status,

    // Change detail fields — only required when status matches
    String oldVenue,
    String newVenue,
    String oldTime,
    String newTime,
    String updateReason,
    String makeUpClassInfo
) {}
