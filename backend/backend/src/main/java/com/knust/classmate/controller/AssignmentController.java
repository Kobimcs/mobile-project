package com.knust.classmate.controller;

import com.knust.classmate.dto.request.AssignmentRequest;
import com.knust.classmate.dto.response.AssignmentResponse;
import com.knust.classmate.service.AssignmentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;

    @Autowired
    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    /**
     * POST /api/assignments
     * Course rep posts a new assignment.
     */
    @PostMapping
    public ResponseEntity<AssignmentResponse> create(
            @Valid @RequestBody AssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(assignmentService.create(request));
    }

    /**
     * GET /api/assignments
     * Returns all assignments newest-first.
     * The frontend handles pending/completed split locally using its own state.
     */
    @GetMapping
    public ResponseEntity<List<AssignmentResponse>> getAll() {
        return ResponseEntity.ok(assignmentService.getAll());
    }
}
