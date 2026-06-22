package com.knust.classmate.service;

import com.knust.classmate.dto.request.ExamVenueRequest;
import com.knust.classmate.dto.response.ExamVenueResponse;
import com.knust.classmate.entity.ExamVenue;
import com.knust.classmate.entity.User;
import com.knust.classmate.repository.ExamVenueRepository;
import com.knust.classmate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExamVenueService {

    private final ExamVenueRepository examVenueRepository;
    private final UserRepository userRepository;

    @Autowired
    public ExamVenueService(ExamVenueRepository examVenueRepository, UserRepository userRepository) {
        this.examVenueRepository = examVenueRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ExamVenueResponse create(ExamVenueRequest request) {
        User creator = getCurrentUser();
        ExamVenue venue = ExamVenue.builder()
            .courseCode(request.courseCode().toUpperCase())
            .courseTitle(request.courseTitle())
            .examDate(request.examDate())
            .examTime(request.examTime())
            .venue(request.venue())
            .startIndex(request.startIndex())
            .endIndex(request.endIndex())
            .note(request.note())
            .createdByUserId(creator.getId())
            .build();
        return ExamVenueResponse.from(examVenueRepository.save(venue));
    }

    public List<ExamVenueResponse> search(Long studentNumber) {
        return examVenueRepository.findByStudentNumber(studentNumber)
            .stream().map(ExamVenueResponse::from).toList();
    }

    public List<ExamVenueResponse> getAll() {
        return examVenueRepository.findAllByOrderByCreatedAtDesc()
            .stream().map(ExamVenueResponse::from).toList();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
