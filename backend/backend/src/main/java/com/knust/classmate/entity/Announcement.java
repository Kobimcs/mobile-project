package com.knust.classmate.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "announcements")
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String targetClassGroup;

    @Column(nullable = false)
    private String postedBy;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime postedAt;

    @Column(nullable = false)
    private Long postedByUserId;

    public Announcement() {}

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getTargetClassGroup() { return targetClassGroup; }
    public void setTargetClassGroup(String targetClassGroup) { this.targetClassGroup = targetClassGroup; }
    public String getPostedBy() { return postedBy; }
    public void setPostedBy(String postedBy) { this.postedBy = postedBy; }
    public LocalDateTime getPostedAt() { return postedAt; }
    public Long getPostedByUserId() { return postedByUserId; }
    public void setPostedByUserId(Long postedByUserId) { this.postedByUserId = postedByUserId; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String title, message, category, targetClassGroup, postedBy;
        private Long postedByUserId;

        public Builder title(String v) { this.title = v; return this; }
        public Builder message(String v) { this.message = v; return this; }
        public Builder category(String v) { this.category = v; return this; }
        public Builder targetClassGroup(String v) { this.targetClassGroup = v; return this; }
        public Builder postedBy(String v) { this.postedBy = v; return this; }
        public Builder postedByUserId(Long v) { this.postedByUserId = v; return this; }

        public Announcement build() {
            Announcement a = new Announcement();
            a.title = this.title;
            a.message = this.message;
            a.category = this.category;
            a.targetClassGroup = this.targetClassGroup;
            a.postedBy = this.postedBy;
            a.postedByUserId = this.postedByUserId;
            return a;
        }
    }
}
