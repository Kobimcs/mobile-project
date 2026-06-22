package com.knust.classmate.repository;

import com.knust.classmate.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    /** All assignments newest-first. */
    List<Assignment> findAllByOrderByCreatedAtDesc();
}
