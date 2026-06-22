package com.knust.classmate.repository;

import com.knust.classmate.entity.TimetableRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableRecordRepository extends JpaRepository<TimetableRecord, Long> {

    /** Returns all records for a specific day — used for Today / Tomorrow tabs. */
    List<TimetableRecord> findByDayOfWeekOrderByStartTimeAsc(String dayOfWeek);

    /** Returns all records ordered by day and time — used for the Week tab. */
    List<TimetableRecord> findAllByOrderByDayOfWeekAscStartTimeAsc();
}
