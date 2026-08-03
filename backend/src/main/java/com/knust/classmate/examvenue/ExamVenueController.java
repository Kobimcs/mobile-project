package com.knust.classmate.examvenue;

import com.knust.classmate.audit.AuditService;
import com.knust.classmate.exception.ApiException;
import com.knust.classmate.labexam.LabExamEntry;
import com.knust.classmate.labexam.LabExamEntryRepository;
import com.knust.classmate.labexam.LabExamLookupResponse;
import com.knust.classmate.labexam.LabExamPdfParser;
import com.knust.classmate.labexam.LabExamUploadResponse;
import com.knust.classmate.user.User;
import com.knust.classmate.user.UserRepository;
import jakarta.validation.Valid;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/exam-venues")
public class ExamVenueController {

    private final ExamVenueRepository examVenueRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final LabExamEntryRepository labExamEntryRepository;
    private final LabExamPdfParser labExamPdfParser;

    @Autowired
    public ExamVenueController(ExamVenueRepository examVenueRepository, UserRepository userRepository,
                               AuditService auditService, LabExamEntryRepository labExamEntryRepository,
                               LabExamPdfParser labExamPdfParser) {
        this.examVenueRepository = examVenueRepository;
        this.userRepository = userRepository;
        this.auditService = auditService;
        this.labExamEntryRepository = labExamEntryRepository;
        this.labExamPdfParser = labExamPdfParser;
    }

    @GetMapping
    public ResponseEntity<List<ExamVenue>> getAll() {
        return ResponseEntity.ok(examVenueRepository.findAll());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ExamVenue>> search(@RequestParam String number) {
        try {
            Long indexNumber = Long.parseLong(number);
            return ResponseEntity.ok(examVenueRepository.findByIndexNumber(indexNumber));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<ExamVenue> create(@Valid @RequestBody ExamVenueRequest request,
                                            Authentication authentication) {
        User user = currentUser(authentication);
        ExamVenue venue = ExamVenue.builder()
            .courseCode(request.courseCode())
            .courseTitle(request.courseTitle())
            .examDate(request.examDate())
            .examTime(request.examTime())
            .venue(request.venue())
            .buildingOrBlock(request.buildingOrBlock())
            .roomOrHall(request.roomOrHall())
            .startIndex(request.startIndex())
            .endIndex(request.endIndex())
            .status(request.status() != null ? request.status() : "pending")
            .createdByUserId(user.getId())
            .build();

        ExamVenue saved = examVenueRepository.save(venue);
        auditService.log("EXAM_VENUE_ADDED",
            request.courseCode() + " (" + request.startIndex() + "–" + request.endIndex() + ")");
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    // Bulk upload from a parsed CSV. Rows missing required fields are skipped;
    // the response reports how many were received vs. actually saved.
    @PostMapping("/bulk")
    public ResponseEntity<Map<String, Object>> createBulk(@RequestBody List<ExamVenueRequest> requests,
                                                           Authentication authentication) {
        User user = currentUser(authentication);
        List<ExamVenue> venues = new ArrayList<>();
        for (ExamVenueRequest r : requests) {
            if (isBlank(r.courseCode()) || isBlank(r.courseTitle()) || isBlank(r.examDate())
                || isBlank(r.examTime()) || isBlank(r.venue()) || isBlank(r.buildingOrBlock())
                || r.startIndex() == null || r.endIndex() == null) {
                continue;
            }
            venues.add(ExamVenue.builder()
                .courseCode(r.courseCode())
                .courseTitle(r.courseTitle())
                .examDate(r.examDate())
                .examTime(r.examTime())
                .venue(r.venue())
                .buildingOrBlock(r.buildingOrBlock())
                .roomOrHall(r.roomOrHall())
                .startIndex(r.startIndex())
                .endIndex(r.endIndex())
                .status(r.status() != null ? r.status() : "pending")
                .createdByUserId(user.getId())
                .build());
        }

        examVenueRepository.saveAll(venues);
        auditService.log("EXAM_VENUE_BULK", venues.size() + " exam venues uploaded via CSV");
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(Map.of("received", requests.size(), "added", venues.size()));
    }

    // Rep uploads a PDF listing students INDIVIDUALLY (not ranges) for one
    // course. Re-uploading a corrected PDF for the same course code cleanly
    // replaces the old set rather than appending to it.
    @PostMapping(value = "/upload-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<LabExamUploadResponse> uploadPdf(
            @RequestParam("file") MultipartFile file,
            @RequestParam("courseCode") String courseCode,
            @RequestParam("courseTitle") String courseTitle,
            @RequestParam("examDate") String examDate,
            @RequestParam("examTime") String examTime,
            Authentication authentication) {
        currentUser(authentication);

        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please choose a lab exam schedule PDF to upload.");
        }
        if (isBlank(courseCode) || isBlank(courseTitle) || isBlank(examDate) || isBlank(examTime)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                "Course code, course title, exam date and exam time are all required.");
        }
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "lab-exam";
        if (!"pdf".equals(extensionOf(originalName))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Please upload a PDF file.");
        }

        String text;
        try (PDDocument document = PDDocument.load(file.getBytes())) {
            text = new PDFTextStripper().getText(document);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                "Could not read the uploaded PDF. Please check the file and try again.");
        }

        List<LabExamPdfParser.ParsedEntry> parsed = labExamPdfParser.parse(text);

        String trimmedCourseCode = courseCode.trim();
        List<LabExamEntry> toSave = new ArrayList<>();
        for (LabExamPdfParser.ParsedEntry p : parsed) {
            toSave.add(LabExamEntry.builder()
                .courseCode(trimmedCourseCode)
                .courseTitle(courseTitle.trim())
                .examDate(examDate.trim())
                .examTime(p.examTime())
                .referenceNumber(p.referenceNumber())
                .venue(p.venue())
                .build());
        }

        labExamEntryRepository.deleteByCourseCodeIgnoreCase(trimmedCourseCode);
        labExamEntryRepository.saveAll(toSave);

        auditService.log("LAB_EXAM_PDF_UPLOADED", trimmedCourseCode + " (" + toSave.size() + " entries)");
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new LabExamUploadResponse(trimmedCourseCode, parsed.size(), toSave.size()));
    }

    // Student search: query is EITHER a 7-digit index number or an 8-digit
    // reference number (decided purely by length, never by leading digits).
    // Always returns HTTP 200 — found:false means "not on this list", not an error.
    @GetMapping("/lookup")
    public ResponseEntity<LabExamLookupResponse> lookup(
            @RequestParam String courseCode,
            @RequestParam String query) {
        if (isBlank(courseCode) || isBlank(query)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Course code and a search number are required.");
        }
        String trimmedQuery = query.trim();
        if (!trimmedQuery.matches("\\d{7}|\\d{8}")) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                "Please enter a 7-digit index number or an 8-digit reference number.");
        }

        String referenceNumber = null;
        if (trimmedQuery.length() == 8) {
            referenceNumber = trimmedQuery;
        } else {
            Optional<User> user = userRepository.findByIndexNumber(trimmedQuery);
            if (user.isEmpty() || isBlank(user.get().getReferenceNumber())) {
                // Per spec: an index number not found in `users` at all stops
                // here — it never reaches the range fallback.
                return ResponseEntity.ok(LabExamLookupResponse.notFound());
            }
            referenceNumber = user.get().getReferenceNumber();
        }

        Optional<LabExamEntry> labExamMatch =
            labExamEntryRepository.findFirstByCourseCodeIgnoreCaseAndReferenceNumber(courseCode.trim(), referenceNumber);
        if (labExamMatch.isPresent()) {
            return ResponseEntity.ok(LabExamLookupResponse.fromLabExam(labExamMatch.get()));
        }

        // Not on the PDF-derived list — fall back to the existing manual
        // range system (reusing its lookup query, not reimplementing it),
        // scoped down to this course code.
        Long numericQuery = Long.parseLong(trimmedQuery);
        Optional<ExamVenue> rangeMatch = examVenueRepository.findByIndexNumber(numericQuery).stream()
            .filter(v -> v.getCourseCode().equalsIgnoreCase(courseCode.trim()))
            .findFirst();

        return ResponseEntity.ok(rangeMatch.map(LabExamLookupResponse::fromRange)
            .orElseGet(LabExamLookupResponse::notFound));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found."));
    }
}
