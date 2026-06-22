package com.knust.classmate.controller;

import com.knust.classmate.dto.response.UserResponse;
import com.knust.classmate.entity.User;
import com.knust.classmate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
public class AdminController {

    private final UserRepository userRepository;

    @Autowired
    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * GET /api/admin/pending-reps
     * Returns all course rep accounts waiting for approval.
     */
    @GetMapping("/pending-reps")
    public ResponseEntity<List<UserResponse>> getPendingReps() {
        List<UserResponse> pending = userRepository.findAll()
                .stream()
                .filter(u -> "PENDING".equals(u.getStatus()))
                .map(UserResponse::from)
                .toList();
        return ResponseEntity.ok(pending);
    }

    /**
     * POST /api/admin/approve-rep/{userId}
     * Approves a pending course rep account.
     */
    @PostMapping("/approve-rep/{userId}")
    public ResponseEntity<UserResponse> approveRep(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus("ACTIVE");
        return ResponseEntity.ok(UserResponse.from(userRepository.save(user)));
    }

    /**
     * POST /api/admin/reject-rep/{userId}
     * Rejects a pending course rep account.
     */
    @PostMapping("/reject-rep/{userId}")
    public ResponseEntity<UserResponse> rejectRep(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus("REJECTED");
        return ResponseEntity.ok(UserResponse.from(userRepository.save(user)));
    }
}
