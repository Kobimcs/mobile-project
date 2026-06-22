package com.knust.classmate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ExamVenueRequest(

    @NotBlank(message = "Course code is required")
    String courseCode,

    @NotBlank(message = "Course title is required")
    String courseTitle,

    @NotBlank(message = "Exam date is required")
    String examDate,

    @NotBlank(message = "Exam time is required")
    String examTime,

    @NotBlank(message = "Venue is required")
    String venue,

    @NotNull(message = "Start number is required")
    Long startIndex,

    @NotNull(message = "End number is required")
    Long endIndex,

    String note
) {}
