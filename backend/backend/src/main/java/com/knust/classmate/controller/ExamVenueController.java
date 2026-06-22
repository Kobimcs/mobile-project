package com.knust.classmate.controller;

import com.knust.classmate.dto.request.ExamVenueRequest;
import com.knust.classmate.dto.response.ExamVenueResponse;
import com.knust.classmate.service.ExamVenueService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exam-venues")
public class ExamVenueController {

    private final ExamVenueService examVenueService;

    @Autowired
    public ExamVenueController(ExamVenueService examVenueService) {
        this.examVenueService = examVenueService;
    }

    /**
     * POST /api/exam-venues
     * Course rep saves an exam venue range.
     */
    @PostMapping
    public ResponseEntity<ExamVenueResponse> create(
            @Valid @RequestBody ExamVenueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(examVenueService.create(request));
    }

    /**
     * GET /api/exam-venues/search?number=6170524
     * Student searches for their venue using their numeric index/reference number.
     * This is the core search query from exam-venue-search.tsx.
     */
    @GetMapping("/search")
    public ResponseEntity<List<ExamVenueResponse>> search(
            @RequestParam Long number) {
        return ResponseEntity.ok(examVenueService.search(number));
    }

    /**
     * GET /api/exam-venues
     * Returns all venue records — used by the rep panel for overview.
     */
    @GetMapping
    public ResponseEntity<List<ExamVenueResponse>> getAll() {
        return ResponseEntity.ok(examVenueService.getAll());
    }
}
