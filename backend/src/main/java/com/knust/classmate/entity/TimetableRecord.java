package com.knust.classmate.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "timetable_records")
public class TimetableRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String courseCode;

    @Column(nullable = false)
    private String courseTitle;

    @Column(nullable = false)
    private String dayOfWeek;

    @Column(nullable = false)
    private String startTime;

    @Column(nullable = false)
    private String endTime;

    @Column(nullable = false)
    private String venue;

    @Column
    private String lecturer;

    @Column
    private String classGroup;

    @Column(nullable = false)
    private String status = "active";

    private String oldVenue;
    private String newVenue;
    private String oldTime;
    private String newTime;
    private String updateReason;
    private String makeUpClassInfo;

    @Column(nullable = false)
    private Long createdByUserId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public TimetableRecord() {}

    public Long getId() { return id; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String v) { this.courseCode = v; }
    public String getCourseTitle() { return courseTitle; }
    public void setCourseTitle(String v) { this.courseTitle = v; }
    public String getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(String v) { this.dayOfWeek = v; }
    public String getStartTime() { return startTime; }
    public void setStartTime(String v) { this.startTime = v; }
    public String getEndTime() { return endTime; }
    public void setEndTime(String v) { this.endTime = v; }
    public String getVenue() { return venue; }
    public void setVenue(String v) { this.venue = v; }
    public String getLecturer() { return lecturer; }
    public void setLecturer(String v) { this.lecturer = v; }
    public String getClassGroup() { return classGroup; }
    public void setClassGroup(String v) { this.classGroup = v; }
    public String getStatus() { return status; }
    public void setStatus(String v) { this.status = v; }
    public String getOldVenue() { return oldVenue; }
    public void setOldVenue(String v) { this.oldVenue = v; }
    public String getNewVenue() { return newVenue; }
    public void setNewVenue(String v) { this.newVenue = v; }
    public String getOldTime() { return oldTime; }
    public void setOldTime(String v) { this.oldTime = v; }
    public String getNewTime() { return newTime; }
    public void setNewTime(String v) { this.newTime = v; }
    public String getUpdateReason() { return updateReason; }
    public void setUpdateReason(String v) { this.updateReason = v; }
    public String getMakeUpClassInfo() { return makeUpClassInfo; }
    public void setMakeUpClassInfo(String v) { this.makeUpClassInfo = v; }
    public Long getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(Long v) { this.createdByUserId = v; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String courseCode, courseTitle, dayOfWeek, startTime, endTime;
        private String venue, lecturer, classGroup, status = "active";
        private String oldVenue, newVenue, oldTime, newTime, updateReason, makeUpClassInfo;
        private Long createdByUserId;

        public Builder courseCode(String v) { this.courseCode = v; return this; }
        public Builder courseTitle(String v) { this.courseTitle = v; return this; }
        public Builder dayOfWeek(String v) { this.dayOfWeek = v; return this; }
        public Builder startTime(String v) { this.startTime = v; return this; }
        public Builder endTime(String v) { this.endTime = v; return this; }
        public Builder venue(String v) { this.venue = v; return this; }
        public Builder lecturer(String v) { this.lecturer = v; return this; }
        public Builder classGroup(String v) { this.classGroup = v; return this; }
        public Builder status(String v) { this.status = v; return this; }
        public Builder oldVenue(String v) { this.oldVenue = v; return this; }
        public Builder newVenue(String v) { this.newVenue = v; return this; }
        public Builder oldTime(String v) { this.oldTime = v; return this; }
        public Builder newTime(String v) { this.newTime = v; return this; }
        public Builder updateReason(String v) { this.updateReason = v; return this; }
        public Builder makeUpClassInfo(String v) { this.makeUpClassInfo = v; return this; }
        public Builder createdByUserId(Long v) { this.createdByUserId = v; return this; }

        public TimetableRecord build() {
            TimetableRecord r = new TimetableRecord();
            r.courseCode = this.courseCode;
            r.courseTitle = this.courseTitle;
            r.dayOfWeek = this.dayOfWeek;
            r.startTime = this.startTime;
            r.endTime = this.endTime;
            r.venue = this.venue;
            r.lecturer = this.lecturer;
            r.classGroup = this.classGroup;
            r.status = this.status;
            r.oldVenue = this.oldVenue;
            r.newVenue = this.newVenue;
            r.oldTime = this.oldTime;
            r.newTime = this.newTime;
            r.updateReason = this.updateReason;
            r.makeUpClassInfo = this.makeUpClassInfo;
            r.createdByUserId = this.createdByUserId;
            return r;
        }
    }
}
