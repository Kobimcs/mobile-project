package com.knust.classmate.labexam;

import com.knust.classmate.audit.AuditService;
import com.knust.classmate.examvenue.ExamVenue;
import com.knust.classmate.examvenue.ExamVenueController;
import com.knust.classmate.examvenue.ExamVenueRepository;
import com.knust.classmate.user.User;
import com.knust.classmate.user.UserRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * Full (a)-(e) validation against the real 634-row sample PDF provided for
 * this feature. Parses it exactly the way the /exam-venues/upload-pdf
 * endpoint would, then exercises the lookup branching against the real
 * parsed data (with a synthetic User/ExamVenue layered on top only where the
 * real data doesn't have an equivalent, e.g. the index-number-to-reference
 * mapping, since this sample has no accompanying `users` table export).
 */
class LabExamRealSampleValidationTest {

    private static final String COURSE_CODE = "CSM 251";

    private static List<LabExamPdfParser.ParsedEntry> parsedEntries;
    private static Map<String, LabExamPdfParser.ParsedEntry> byReference;

    @BeforeAll
    static void parseRealSample() throws IOException {
        // The sample contains real students' names, index numbers and
        // reference numbers, so it's gitignored (see backend/.gitignore) and
        // only ever present on a machine someone has dropped it onto by hand.
        // Skip cleanly instead of failing when it isn't there.
        InputStream in = LabExamRealSampleValidationTest.class.getResourceAsStream("/lab-exam-sample.pdf");
        Assumptions.assumeTrue(in != null, "lab-exam-sample.pdf not present — skipping real-sample validation.");

        String text;
        try (PDDocument document = PDDocument.load(in)) {
            text = new PDFTextStripper().getText(document);
        } finally {
            in.close();
        }
        parsedEntries = new LabExamPdfParser().parse(text);
        byReference = parsedEntries.stream()
            .collect(Collectors.toMap(LabExamPdfParser.ParsedEntry::referenceNumber, e -> e, (a, b) -> a));
    }

    // (a) Parse count close to 634.
    @Test
    void a_parsesCloseTo634Entries() {
        System.out.println("(a) Parsed " + parsedEntries.size() + " entries out of 634 expected rows.");
        assertThat(parsedEntries.size()).isGreaterThanOrEqualTo(630);
        assertThat(parsedEntries.size()).isLessThanOrEqualTo(634);
    }

    // (b) Reference 21475407 -> "MED SCH LAB" / "11:45AM".
    @Test
    void b_reference21475407ResolvesToExpectedVenueAndTime() {
        LabExamPdfParser.ParsedEntry entry = byReference.get("21475407");
        System.out.println("(b) 21475407 -> venue=" + (entry != null ? entry.venue() : null)
            + ", time=" + (entry != null ? entry.examTime() : null));
        assertThat(entry).isNotNull();
        assertThat(entry.venue()).isEqualTo("MED SCH LAB");
        assertThat(entry.examTime()).isEqualTo("11:45AM");
    }

    // (c) A 7-digit index belonging to a registered user resolves through
    // their reference number to the correct real, parsed venue.
    @Test
    void c_sevenDigitIndexResolvesThroughUserToRealParsedVenue() {
        LabExamEntry entry = toEntity(byReference.get("21475407"));

        ExamVenueRepository examVenueRepository = mock(ExamVenueRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        LabExamEntryRepository labExamEntryRepository = mock(LabExamEntryRepository.class);
        AuditService auditService = mock(AuditService.class);
        ExamVenueController controller = new ExamVenueController(examVenueRepository, userRepository,
            auditService, labExamEntryRepository, new LabExamPdfParser());

        User user = User.builder().fullName("Pa Alieu Njie").email("pa@example.com").password("x")
            .indexNumber("1234567").referenceNumber("21475407").build();
        when(userRepository.findByIndexNumber("1234567")).thenReturn(Optional.of(user));
        when(labExamEntryRepository.findFirstByCourseCodeIgnoreCaseAndReferenceNumber(COURSE_CODE, "21475407"))
            .thenReturn(Optional.of(entry));

        ResponseEntity<LabExamLookupResponse> response = controller.lookup(COURSE_CODE, "1234567");

        System.out.println("(c) index 1234567 -> found=" + response.getBody().found()
            + ", venue=" + response.getBody().venue() + ", time=" + response.getBody().examTime());
        assertThat(response.getBody().found()).isTrue();
        assertThat(response.getBody().venue()).isEqualTo("MED SCH LAB");
        assertThat(response.getBody().examTime()).isEqualTo("11:45AM");
    }

    // (d) A query matching nothing returns found:false; the SAME query
    // resolves via the existing range fallback once a matching range exists.
    @Test
    void d_unmatchedQueryReturnsFoundFalseThenRangeFallbackFindsIt() {
        String unmatchedReference = "99999999";
        assertThat(byReference).doesNotContainKey(unmatchedReference);

        ExamVenueRepository examVenueRepository = mock(ExamVenueRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        LabExamEntryRepository labExamEntryRepository = mock(LabExamEntryRepository.class);
        AuditService auditService = mock(AuditService.class);
        ExamVenueController controller = new ExamVenueController(examVenueRepository, userRepository,
            auditService, labExamEntryRepository, new LabExamPdfParser());

        when(labExamEntryRepository.findFirstByCourseCodeIgnoreCaseAndReferenceNumber(COURSE_CODE, unmatchedReference))
            .thenReturn(Optional.empty());
        when(examVenueRepository.findByIndexNumber(anyLong())).thenReturn(List.of());

        ResponseEntity<LabExamLookupResponse> notFoundResponse = controller.lookup(COURSE_CODE, unmatchedReference);
        System.out.println("(d) no range, no lab-exam match -> found=" + notFoundResponse.getBody().found());
        assertThat(notFoundResponse.getStatusCode().value()).isEqualTo(200);
        assertThat(notFoundResponse.getBody().found()).isFalse();

        ExamVenue range = ExamVenue.builder()
            .courseCode(COURSE_CODE).courseTitle("Intro Electronics").examDate("2026-08-10")
            .examTime("9:00AM").venue("Great Hall").buildingOrBlock("Main Block")
            .startIndex(99999000L).endIndex(99999999L).createdByUserId(1L).build();
        when(examVenueRepository.findByIndexNumber(99999999L)).thenReturn(List.of(range));

        ResponseEntity<LabExamLookupResponse> rangeResponse = controller.lookup(COURSE_CODE, unmatchedReference);
        System.out.println("(d) with matching range -> found=" + rangeResponse.getBody().found()
            + ", source=" + rangeResponse.getBody().source() + ", venue=" + rangeResponse.getBody().venue());
        assertThat(rangeResponse.getBody().found()).isTrue();
        assertThat(rangeResponse.getBody().source()).isEqualTo("RANGE");
        assertThat(rangeResponse.getBody().venue()).isEqualTo("Great Hall");
    }

    // (e) Spot-check the real name-runs-directly-into-reference-number rows
    // (no space before the 8 digits) and confirm neither they nor their
    // immediate neighbors were corrupted.
    @Test
    void e_mashedAndNoSpaceRowsDidNotCorruptNeighboringEntries() {
        // Row 22/23/24: "...,ABDUL-SAMED 21108422..." then "...,ABDUL-SAME21108421..." (no space) then "...,ABLORDEPPEY 21082695..."
        assertRow("21108422", "PB- SIM LAB", "10:00AM");
        assertRow("21108421", "PB- SIM LAB", "10:00AM"); // the glued name+ref row itself
        assertRow("21082695", "PB- SIM LAB", "10:00AM");

        // Row 413/414/415: "...,KANKAM 21082386..." then "...,KANTORGORJ21122623..." then "...,KARIKARI 21128414..."
        assertRow("21082386", "COS FF 17", "11:45AM");
        assertRow("21122623", "COS FF 17", "11:45AM");
        assertRow("21128414", "COS FF 17", "11:45AM");

        // Row 463/464/465: "...,MENSAH 21133789..." then "...,MENSAH ABRAMP21143635..." then "...,MENYAWOVOR 21074452..."
        assertRow("21133789", "MED SCH LAB", "11:45AM");
        assertRow("21143635", "MED SCH LAB", "11:45AM");
        assertRow("21074452", "MED SCH LAB", "11:45AM");

        // Row 540/541/542: "...,OPPONG 21108404..." then "...,OPPONG - AGYAR21137957..." then "...,OSAFO 21151400..."
        assertRow("21108404", "PHARM LAB", "11:45AM");
        assertRow("21137957", "PHARM LAB", "11:45AM");
        assertRow("21151400", "PHARM LAB", "11:45AM");

        System.out.println("(e) All 12 spot-checked references (4 no-space rows + their 8 neighbors) parsed correctly.");
    }

    private static void assertRow(String reference, String expectedVenue, String expectedTime) {
        LabExamPdfParser.ParsedEntry entry = byReference.get(reference);
        assertThat(entry).as("reference " + reference).isNotNull();
        assertThat(entry.venue()).as("venue for " + reference).isEqualTo(expectedVenue);
        assertThat(entry.examTime()).as("time for " + reference).isEqualTo(expectedTime);
    }

    private static LabExamEntry toEntity(LabExamPdfParser.ParsedEntry parsed) {
        return LabExamEntry.builder()
            .courseCode(COURSE_CODE).courseTitle("Intro Electronics").examDate("2026-08-10")
            .examTime(parsed.examTime()).referenceNumber(parsed.referenceNumber()).venue(parsed.venue())
            .build();
    }
}
