package com.knust.classmate.labexam;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabExamEntryRepository extends JpaRepository<LabExamEntry, Long> {

    List<LabExamEntry> findByCourseCodeIgnoreCase(String courseCode);

    Optional<LabExamEntry> findFirstByCourseCodeIgnoreCaseAndReferenceNumber(String courseCode, String referenceNumber);

    void deleteByCourseCodeIgnoreCase(String courseCode);
}
