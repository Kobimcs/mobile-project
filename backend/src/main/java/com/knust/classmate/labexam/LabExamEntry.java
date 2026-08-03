package com.knust.classmate.labexam;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * One student's per-student lab exam placement, parsed from a rep-uploaded PDF.
 * Separate from {@link com.knust.classmate.examvenue.ExamVenue}, which stores
 * start/end index RANGES entered manually or via CSV — this table stores an
 * individual reference number -> venue mapping per course.
 */
@Entity
@Table(name = "lab_exam_entries", indexes = {
    @Index(name = "idx_lab_exam_course_reference", columnList = "course_code, reference_number")
})
public class LabExamEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String courseCode;

    @Column(nullable = false)
    private String courseTitle;

    @Column(nullable = false)
    private String examDate;

    @Column(nullable = false)
    private String examTime;

    // Always exactly 8 digits; the leading digits vary by student cohort and
    // must never be validated/assumed beyond "8 digits" (see LabExamPdfParser).
    @Column(nullable = false, length = 8)
    private String referenceNumber;

    @Column(nullable = false)
    private String venue;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;

    public LabExamEntry() {}

    public Long getId() { return id; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String courseCode) { this.courseCode = courseCode; }
    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String courseTitle) { this.courseTitle = courseTitle; }
    public String getExamDate() { return examDate; }
    public void setExamDate(String examDate) { this.examDate = examDate; }
    public String getExamTime() { return examTime; }
    public void setExamTime(String examTime) { this.examTime = examTime; }
    public String getReferenceNumber() { return referenceNumber; }
    public void setReferenceNumber(String referenceNumber) { this.referenceNumber = referenceNumber; }
    public String getVenue() { return venue; }
    public void setVenue(String venue) { this.venue = venue; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String courseCode, courseTitle, examDate, examTime, referenceNumber, venue;

        public Builder courseCode(String v) { this.courseCode = v; return this; }
        public Builder courseTitle(String v) { this.courseTitle = v; return this; }
        public Builder examDate(String v) { this.examDate = v; return this; }
        public Builder examTime(String v) { this.examTime = v; return this; }
        public Builder referenceNumber(String v) { this.referenceNumber = v; return this; }
        public Builder venue(String v) { this.venue = v; return this; }

        public LabExamEntry build() {
            LabExamEntry e = new LabExamEntry();
            e.courseCode = this.courseCode;
            e.courseTitle = this.courseTitle;
            e.examDate = this.examDate;
            e.examTime = this.examTime;
            e.referenceNumber = this.referenceNumber;
            e.venue = this.venue;
            return e;
        }
    }
}
