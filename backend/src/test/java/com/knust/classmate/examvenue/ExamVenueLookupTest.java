package com.knust.classmate.examvenue;

import com.knust.classmate.audit.AuditService;
import com.knust.classmate.exception.ApiException;
import com.knust.classmate.labexam.LabExamEntry;
import com.knust.classmate.labexam.LabExamEntryRepository;
import com.knust.classmate.labexam.LabExamLookupResponse;
import com.knust.classmate.labexam.LabExamPdfParser;
import com.knust.classmate.user.User;
import com.knust.classmate.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Exercises GET /exam-venues/lookup's branching directly against mocked
 * repositories — no PDF, no real database, no JWT — so the 7-vs-8-digit
 * decision, the not-found paths and the range fallback can be verified before
 * the real 634-row sample is available.
 */
class ExamVenueLookupTest {

    private ExamVenueRepository examVenueRepository;
    private UserRepository userRepository;
    private LabExamEntryRepository labExamEntryRepository;
    private ExamVenueController controller;

    @BeforeEach
    void setUp() {
        examVenueRepository = mock(ExamVenueRepository.class);
        userRepository = mock(UserRepository.class);
        labExamEntryRepository = mock(LabExamEntryRepository.class);
        AuditService auditService = mock(AuditService.class);
        LabExamPdfParser parser = new LabExamPdfParser();
        controller = new ExamVenueController(examVenueRepository, userRepository, auditService,
            labExamEntryRepository, parser);
    }

    @Test
    void eightDigitQueryMatchesReferenceNumberDirectly() {
        LabExamEntry entry = LabExamEntry.builder()
            .courseCode("CSM 251").courseTitle("Intro Electronics").examDate("2026-08-10")
            .examTime("11:45AM").referenceNumber("21475407").venue("MED SCH LAB").build();
        when(labExamEntryRepository.findFirstByCourseCodeIgnoreCaseAndReferenceNumber("CSM 251", "21475407"))
            .thenReturn(Optional.of(entry));

        ResponseEntity<LabExamLookupResponse> response = controller.lookup("CSM 251", "21475407");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        LabExamLookupResponse body = response.getBody();
        assertThat(body.found()).isTrue();
        assertThat(body.source()).isEqualTo("LAB_EXAM_PDF");
        assertThat(body.venue()).isEqualTo("MED SCH LAB");
        assertThat(body.examTime()).isEqualTo("11:45AM");
        verifyNoInteractions(userRepository);
    }

    @Test
    void sevenDigitIndexResolvesToReferenceThenMatchesLabExamEntry() {
        User user = User.builder().fullName("Test Student").email("t@example.com").password("x")
            .indexNumber("1234567").referenceNumber("21475407").build();
        when(userRepository.findByIndexNumber("1234567")).thenReturn(Optional.of(user));

        LabExamEntry entry = LabExamEntry.builder()
            .courseCode("CSM 251").courseTitle("Intro Electronics").examDate("2026-08-10")
            .examTime("11:45AM").referenceNumber("21475407").venue("MED SCH LAB").build();
        when(labExamEntryRepository.findFirstByCourseCodeIgnoreCaseAndReferenceNumber("CSM 251", "21475407"))
            .thenReturn(Optional.of(entry));

        ResponseEntity<LabExamLookupResponse> response = controller.lookup("CSM 251", "1234567");

        assertThat(response.getBody().found()).isTrue();
        assertThat(response.getBody().venue()).isEqualTo("MED SCH LAB");
        verify(userRepository).findByIndexNumber("1234567");
    }

    @Test
    void sevenDigitIndexNotFoundInUsersStopsImmediatelyWithoutRangeFallback() {
        when(userRepository.findByIndexNumber("9999999")).thenReturn(Optional.empty());

        ResponseEntity<LabExamLookupResponse> response = controller.lookup("CSM 251", "9999999");

        assertThat(response.getBody().found()).isFalse();
        // Per spec: an index not found in `users` stops here — the range
        // fallback must never be attempted for this case.
        verify(examVenueRepository, never()).findByIndexNumber(anyLong());
    }

    @Test
    void notFoundInLabExamFallsBackToExistingRangeSystemScopedToCourse() {
        when(labExamEntryRepository.findFirstByCourseCodeIgnoreCaseAndReferenceNumber(any(), any()))
            .thenReturn(Optional.empty());

        ExamVenue matchingRange = ExamVenue.builder()
            .courseCode("CSM 251").courseTitle("Intro Electronics").examDate("2026-08-10")
            .examTime("9:00AM").venue("Great Hall").buildingOrBlock("Main Block")
            .startIndex(20000000L).endIndex(20999999L).createdByUserId(1L).build();
        ExamVenue otherCourseRange = ExamVenue.builder()
            .courseCode("CSM 999").courseTitle("Other").examDate("2026-08-10")
            .examTime("9:00AM").venue("Wrong Hall").buildingOrBlock("Other Block")
            .startIndex(20000000L).endIndex(20999999L).createdByUserId(1L).build();
        // Query is 8 digits, so it's treated directly as a reference number
        // (no users lookup); when it misses lab_exam_entries, the raw query
        // is reused as-is against the existing range repository method.
        when(examVenueRepository.findByIndexNumber(20123456L)).thenReturn(List.of(otherCourseRange, matchingRange));

        ResponseEntity<LabExamLookupResponse> response = controller.lookup("CSM 251", "20123456");

        assertThat(response.getBody().found()).isTrue();
        assertThat(response.getBody().source()).isEqualTo("RANGE");
        assertThat(response.getBody().venue()).isEqualTo("Great Hall");
    }

    @Test
    void queryMatchingNothingAnywhereReturnsFoundFalseWithHttp200() {
        when(labExamEntryRepository.findFirstByCourseCodeIgnoreCaseAndReferenceNumber(any(), any()))
            .thenReturn(Optional.empty());
        when(examVenueRepository.findByIndexNumber(anyLong())).thenReturn(List.of());

        ResponseEntity<LabExamLookupResponse> response = controller.lookup("CSM 251", "20000000");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().found()).isFalse();
        assertThat(response.getBody().source()).isNull();
    }

    @Test
    void rejectsQueryThatIsNeitherSevenNorEightDigits() {
        assertThatThrownBy(() -> controller.lookup("CSM 251", "12345"))
            .isInstanceOf(ApiException.class);
    }
}
