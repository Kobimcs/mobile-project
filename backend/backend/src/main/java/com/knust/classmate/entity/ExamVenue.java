package com.knust.classmate.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_venues")
public class ExamVenue {

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

    @Column(nullable = false)
    private String venue;

    @Column(nullable = false)
    private Long startIndex;

    @Column(nullable = false)
    private Long endIndex;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false)
    private String status = "Pending";

    @Column(nullable = false)
    private Long createdByUserId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public ExamVenue() {}

    public Long getId() { return id; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String v) { this.courseCode = v; }
    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String v) { this.courseTitle = v; }
    public String getExamDate() { return examDate; }
    public void setExamDate(String v) { this.examDate = v; }
    public String getExamTime() { return examTime; }
    public void setExamTime(String v) { this.examTime = v; }
    public String getVenue() { return venue; }
    public void setVenue(String v) { this.venue = v; }
    public Long getStartIndex() { return startIndex; }
    public void setStartIndex(Long v) { this.startIndex = v; }
    public Long getEndIndex() { return endIndex; }
    public void setEndIndex(Long v) { this.endIndex = v; }
    public String getNote() { return note; }
    public void setNote(String v) { this.note = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long v) { this.createdByUserId = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String courseCode, courseTitle, examDate, examTime, venue, note;
        private Long startIndex, endIndex, createdByUserId;

        public Builder courseCode(String v) { this.courseCode = v; return this; }
        public Builder courseTitle(String v) { this.courseTitle = v; return this; }
        public Builder examDate(String v) { this.examDate = v; return this; }
        public Builder examTime(String v) { this.examTime = v; return this; }
        public Builder venue(String v) { this.venue = v; return this; }
        public Builder note(String v) { this.note = v; return this; }
        public Builder startIndex(Long v) { this.startIndex = v; return this; }
        public Builder endIndex(Long v) { this.endIndex = v; return this; }
        public Builder createdByUserId(Long v) { this.createdByUserId = v; return this; }

        public ExamVenue build() {
            ExamVenue e = new ExamVenue();
            e.courseCode = this.courseCode;
            e.courseTitle = this.courseTitle;
            e.examDate = this.examDate;
            e.examTime = this.examTime;
            e.venue = this.venue;
            e.note = this.note;
            e.startIndex = this.startIndex;
            e.endIndex = this.endIndex;
            e.createdByUserId = this.createdByUserId;
            return e;
        }
    }
}
