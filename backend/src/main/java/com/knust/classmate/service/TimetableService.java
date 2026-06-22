package com.knust.classmate.service;

import com.knust.classmate.dto.request.TimetableRequest;
import com.knust.classmate.dto.response.TimetableResponse;
import com.knust.classmate.entity.TimetableRecord;
import com.knust.classmate.entity.User;
import com.knust.classmate.repository.TimetableRecordRepository;
import com.knust.classmate.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TimetableService {

    private final TimetableRecordRepository timetableRepository;
    private final UserRepository userRepository;

    @Autowired
    public TimetableService(TimetableRecordRepository timetableRepository, UserRepository userRepository) {
        this.timetableRepository = timetableRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public TimetableResponse create(TimetableRequest request) {
        User creator = getCurrentUser();
        String status = mapStatus(request.status());
        TimetableRecord record = TimetableRecord.builder()
            .courseCode(request.courseCode().toUpperCase())
            .courseTitle(request.courseTitle())
            .dayOfWeek(request.dayOfWeek())
            .startTime(request.startTime())
            .endTime(request.endTime())
            .venue(request.venue())
            .lecturer(request.lecturer())
            .classGroup(request.classGroup())
            .status(status)
            .oldVenue(request.oldVenue())
            .newVenue(request.newVenue())
            .oldTime(request.oldTime())
            .newTime(request.newTime())
            .updateReason(request.updateReason())
            .makeUpClassInfo(request.makeUpClassInfo())
            .createdByUserId(creator.getId())
            .build();
        return TimetableResponse.from(timetableRepository.save(record));
    }

    public List<TimetableResponse> getByDay(String day) {
        return timetableRepository.findByDayOfWeekOrderByStartTimeAsc(day)
            .stream().map(TimetableResponse::from).toList();
    }

    public List<TimetableResponse> getAll() {
        return timetableRepository.findAllByOrderByDayOfWeekAscStartTimeAsc()
            .stream().map(TimetableResponse::from).toList();
    }

    private String mapStatus(String s) {
        if (s == null) return "active";
        return switch (s) {
            case "Venue Changed" -> "venue_changed";
            case "Time Changed"  -> "time_changed";
            case "Cancelled"     -> "cancelled";
            default              -> "active";
        };
    }

    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
