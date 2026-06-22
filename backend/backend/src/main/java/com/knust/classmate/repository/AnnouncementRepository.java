package com.knust.classmate.repository;

import com.knust.classmate.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    /** All announcements newest-first — what the student feed shows. */
    List<Announcement> findAllByOrderByPostedAtDesc();

    /** Filter by category, e.g. "Exam", "General". */
    List<Announcement> findByCategoryOrderByPostedAtDesc(String category);
}
