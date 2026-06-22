package com.knust.classmate.dto.response;

import com.knust.classmate.entity.ExamVenue;

public record ExamVenueResponse(
    Long id,
    String courseCode,
    String courseTitle,
    String examDate,
    String examTime,
    String venue,
    Long startIndex,
    Long endIndex,
    String note,
    String status
) {
    public static ExamVenueResponse from(ExamVenue e) {
        return new ExamVenueResponse(
            e.getId(),
            e.getCourseCode(),
            e.getCourseTitle(),
            e.getExamDate(),
            e.getExamTime(),
            e.getVenue(),
            e.getStartIndex(),
            e.getEndIndex(),
            e.getNote(),
            e.getStatus()
        );
    }
}
