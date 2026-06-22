package com.knust.classmate.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "assignments")
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String courseCode;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String dueDate;

    @Column(columnDefinition = "TEXT")
    private String instructions;

    @Column
    private String fileName;

    @Column
    private String fileUrl;

    @Column(nullable = false)
    private String postedBy;

    @Column(nullable = false)
    private Long postedByUserId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public Assignment() {}

    public Long getId() { return id; }
    public String getCourseCode() { return courseCode; }
    public void setCourseCode(String v) { this.courseCode = v; }
    public String getTitle() { return title; }
    public void setTitle(String v) { this.title = v; }
    public String getDueDate() { return dueDate; }
    public void setDueDate(String v) { this.dueDate = v; }
    public String getInstructions() { return instructions; }
    public void setInstructions(String v) { this.instructions = v; }
    public String getFileName() { return fileName; }
    public void setFileName(String v) { this.fileName = v; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String v) { this.fileUrl = v; }
    public String getPostedBy() { return postedBy; }
    public void setPostedBy(String v) { this.postedBy = v; }
    public Long getPostedByUserId() { return postedByUserId; }
    public void setPostedByUserId(Long v) { this.postedByUserId = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String courseCode, title, dueDate, instructions, fileName, fileUrl, postedBy;
        private Long postedByUserId;

        public Builder courseCode(String v) { this.courseCode = v; return this; }
        public Builder title(String v) { this.title = v; return this; }
        public Builder dueDate(String v) { this.dueDate = v; return this; }
        public Builder instructions(String v) { this.instructions = v; return this; }
        public Builder fileName(String v) { this.fileName = v; return this; }
        public Builder fileUrl(String v) { this.fileUrl = v; return this; }
        public Builder postedBy(String v) { this.postedBy = v; return this; }
        public Builder postedByUserId(Long v) { this.postedByUserId = v; return this; }

        public Assignment build() {
            Assignment a = new Assignment();
            a.courseCode = this.courseCode;
            a.title = this.title;
            a.dueDate = this.dueDate;
            a.instructions = this.instructions;
            a.fileName = this.fileName;
            a.fileUrl = this.fileUrl;
            a.postedBy = this.postedBy;
            a.postedByUserId = this.postedByUserId;
            return a;
        }
    }
}
