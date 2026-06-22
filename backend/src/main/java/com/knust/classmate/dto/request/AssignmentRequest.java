package com.knust.classmate.dto.request;

import jakarta.validation.constraints.NotBlank;

public record AssignmentRequest(

    @NotBlank(message = "Course code is required")
    String courseCode,

    @NotBlank(message = "Title is required")
    String title,

    @NotBlank(message = "Due date is required")
    String dueDate,

    String instructions,

    // fileName and fileUrl are set by the service after file upload
    String fileName,
    String fileUrl
) {}
