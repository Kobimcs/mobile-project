package com.knust.classmate.controller;

import com.knust.classmate.dto.request.AnnouncementRequest;
import com.knust.classmate.dto.response.AnnouncementResponse;
import com.knust.classmate.service.AnnouncementService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @Autowired
    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    /**
     * POST /api/announcements
     * Course rep posts a new announcement.
     */
    @PostMapping
    public ResponseEntity<AnnouncementResponse> create(
            @Valid @RequestBody AnnouncementRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(announcementService.create(request));
    }

    /**
     * GET /api/announcements
     * Returns all announcements newest-first.
     * Optional ?category=Exam filter.
     */
    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> getAll(
            @RequestParam(required = false) String category) {
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(announcementService.getByCategory(category));
        }
        return ResponseEntity.ok(announcementService.getAll());
    }
}
