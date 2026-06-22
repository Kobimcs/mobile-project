package com.knust.classmate.service;

import com.knust.classmate.dto.request.AssignmentRequest;
import com.knust.classmate.dto.response.AssignmentResponse;
import com.knust.classmate.entity.Assignment;
import com.knust.classmate.entity.User;
import com.knust.classmate.repository.AssignmentRepository;
import com.knust.classmate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;

    @Autowired
    public AssignmentService(AssignmentRepository assignmentRepository, UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AssignmentResponse create(AssignmentRequest request) {
        User poster = getCurrentUser();
        Assignment assignment = Assignment.builder()
            .courseCode(request.courseCode().toUpperCase())
            .title(request.title())
            .dueDate(request.dueDate())
            .instructions(request.instructions())
            .fileName(request.fileName())
            .fileUrl(request.fileUrl())
            .postedBy(poster.getFullName())
            .postedByUserId(poster.getId())
            .build();
        return AssignmentResponse.from(assignmentRepository.save(assignment));
    }

    public List<AssignmentResponse> getAll() {
        return assignmentRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(AssignmentResponse::from).toList();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
