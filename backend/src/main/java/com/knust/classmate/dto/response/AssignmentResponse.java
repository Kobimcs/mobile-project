package com.knust.classmate.dto.response;

import com.knust.classmate.entity.Assignment;

public record AssignmentResponse(
    Long id,
    String courseCode,
    String title,
    String dueDate,
    String instructions,
    String fileName,
    String fileUrl,
    String postedBy
) {
    public static AssignmentResponse from(Assignment a) {
        return new AssignmentResponse(
            a.getId(),
            a.getCourseCode(),
            a.getTitle(),
            a.getDueDate(),
            a.getInstructions(),
            a.getFileName(),
            a.getFileUrl(),
            a.getPostedBy()
        );
    }
}
