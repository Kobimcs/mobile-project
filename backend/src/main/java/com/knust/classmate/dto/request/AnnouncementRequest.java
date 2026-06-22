package com.knust.classmate.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnnouncementRequest(

    @NotBlank(message = "Title is required")
    @Size(min = 3, message = "Title must be at least 3 characters")
    String title,

    @NotBlank(message = "Category is required")
    String category,

    @NotBlank(message = "Message is required")
    @Size(min = 10, message = "Message must be at least 10 characters")
    String message,

    @NotBlank(message = "Target class group is required")
    String targetClassGroup
) {}
