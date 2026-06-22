package com.knust.classmate.controller;

import com.knust.classmate.dto.request.TimetableRequest;
import com.knust.classmate.dto.response.TimetableResponse;
import com.knust.classmate.service.TimetableService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/timetable")
public class TimetableController {

    private final TimetableService timetableService;

    @Autowired
    public TimetableController(TimetableService timetableService) {
        this.timetableService = timetableService;
    }

    /**
     * POST /api/timetable
     * Course rep adds a class record.
     */
    @PostMapping
    public ResponseEntity<TimetableResponse> create(
            @Valid @RequestBody TimetableRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(timetableService.create(request));
    }

    /**
     * GET /api/timetable
     * Returns all records (week view).
     * Optional ?day=Monday to filter by day (today / tomorrow views).
     */
    @GetMapping
    public ResponseEntity<List<TimetableResponse>> getAll(
            @RequestParam(required = false) String day) {
        if (day != null && !day.isBlank()) {
            return ResponseEntity.ok(timetableService.getByDay(day));
        }
        return ResponseEntity.ok(timetableService.getAll());
    }
}
