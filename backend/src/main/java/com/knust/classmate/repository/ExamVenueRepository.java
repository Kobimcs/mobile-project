package com.knust.classmate.repository;

import com.knust.classmate.entity.ExamVenue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExamVenueRepository extends JpaRepository<ExamVenue, Long> {

    /**
     * The key search query: given a student's numeric index/reference number,
     * find which venue range it falls in.
     */
    @Query("SELECT e FROM ExamVenue e WHERE :number BETWEEN e.startIndex AND e.endIndex")
    List<ExamVenue> findByStudentNumber(@Param("number") Long number);

    List<ExamVenue> findAllByOrderByCreatedAtDesc();
}
