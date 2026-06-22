package com.knust.classmate.service;

import com.knust.classmate.dto.request.AnnouncementRequest;
import com.knust.classmate.dto.response.AnnouncementResponse;
import com.knust.classmate.entity.Announcement;
import com.knust.classmate.entity.User;
import com.knust.classmate.repository.AnnouncementRepository;
import com.knust.classmate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final UserRepository userRepository;

    @Autowired
    public AnnouncementService(AnnouncementRepository announcementRepository, UserRepository userRepository) {
        this.announcementRepository = announcementRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public AnnouncementResponse create(AnnouncementRequest request) {
        User poster = getCurrentUser();
        Announcement announcement = Announcement.builder()
            .title(request.title())
            .category(request.category())
            .message(request.message())
            .targetClassGroup(request.targetClassGroup())
            .postedBy(poster.getFullName())
            .postedByUserId(poster.getId())
            .build();
        return AnnouncementResponse.from(announcementRepository.save(announcement));
    }

    public List<AnnouncementResponse> getAll() {
        return announcementRepository.findAllByOrderByPostedAtDesc()
            .stream().map(AnnouncementResponse::from).toList();
    }

    public List<AnnouncementResponse> getByCategory(String category) {
        return announcementRepository.findByCategoryOrderByPostedAtDesc(category)
            .stream().map(AnnouncementResponse::from).toList();
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
