package com.knust.classmate.dto.response;

import com.knust.classmate.entity.TimetableRecord;

public record TimetableResponse(
    Long id,
    String courseCode,
    String courseTitle,
    String dayOfWeek,
    String startTime,
    String endTime,
    String venue,
    String lecturer,
    String classGroup,
    String status
) {
    public static TimetableResponse from(TimetableRecord r) {
        return new TimetableResponse(
            r.getId(),
            r.getCourseCode(),
            r.getCourseTitle(),
            r.getDayOfWeek(),
            r.getStartTime(),
            r.getEndTime(),
            r.getVenue(),
            r.getLecturer(),
            r.getClassGroup(),
            r.getStatus()
        );
    }
}
