package com.knust.classmate.labexam;

import com.knust.classmate.examvenue.ExamVenue;

/**
 * Always returned with HTTP 200, even when nothing matched — {@code found:false}
 * lets the frontend show a "you're not on this list" message instead of
 * treating an unmatched search as an error.
 */
public record LabExamLookupResponse(
    boolean found,
    String source, // "LAB_EXAM_PDF" or "RANGE"; null when not found
    String courseCode,
    String courseTitle,
    String examDate,
    String examTime,
    String venue,
    String buildingOrBlock, // only populated when source is "RANGE"
    String roomOrHall,      // only populated when source is "RANGE"
    String status           // only populated when source is "RANGE"
) {
    public static LabExamLookupResponse notFound() {
        return new LabExamLookupResponse(false, null, null, null, null, null, null, null, null, null);
    }

    public static LabExamLookupResponse fromLabExam(LabExamEntry entry) {
        return new LabExamLookupResponse(
            true, "LAB_EXAM_PDF",
            entry.getCourseCode(), entry.getCourseTitle(), entry.getExamDate(), entry.getExamTime(),
            entry.getVenue(), null, null, null
        );
    }

    public static LabExamLookupResponse fromRange(ExamVenue venue) {
        return new LabExamLookupResponse(
            true, "RANGE",
            venue.getCourseCode(), venue.getCourseTitle(), venue.getExamDate(), venue.getExamTime(),
            venue.getVenue(), venue.getBuildingOrBlock(), venue.getRoomOrHall(), venue.getStatus()
        );
    }
}
