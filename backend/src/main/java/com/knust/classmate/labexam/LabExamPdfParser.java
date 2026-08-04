package com.knust.classmate.labexam;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses the messy per-student rows of a lab exam schedule PDF, e.g.:
 *   "483 Pa Alieu ,NJIE 21475407 MED SCH LAB 11:45AM"
 * Does NOT parse by fixed columns/position. For each row it only cares about
 * two anchors: the reference number (always exactly 8 digits — never assume
 * anything about the leading digits, they vary by cohort/year) and the
 * "<venue> <time>" text that follows it. Everything before the reference
 * number (row number, name, however messy) is ignored entirely.
 */
@Component
public class LabExamPdfParser {

    // Exactly 8 consecutive digits, with no digit immediately before or after
    // (so it isn't a substring of a longer run). This deliberately does NOT
    // use \b, because a name can run directly into the reference number with
    // no space (e.g. "ABDUL-SAME21108421") — \b would not match between a
    // letter and a digit since both are \w, but a letter is never a \d, so
    // the (?<!\d) lookbehind still correctly anchors the start of the run.
    private static final Pattern REFERENCE_NUMBER = Pattern.compile("(?<!\\d)\\d{8}(?!\\d)");

    private static final Pattern TIME = Pattern.compile("(\\d{1,2}:\\d{2}\\s*[APap][Mm])");

    // Matches the header's "DATE:" line, e.g. "DATE: FRIDAY, JULY 10,, 2026".
    // '.' doesn't match line terminators by default, so this naturally stops
    // at the end of that line without needing the text pre-collapsed.
    private static final Pattern DATE_LINE = Pattern.compile("DATE:\\s*(.+)", Pattern.CASE_INSENSITIVE);

    // How far past a reference number we'll look for its "<venue> <time>".
    // Real venue strings are short ("MED SCH LAB", "PB- SIM LAB", "COS SF 26"),
    // so this comfortably covers them while staying short enough not to bleed
    // into an unrelated later row if two reference numbers end up far apart
    // (e.g. a page break/header between them).
    private static final int VENUE_WINDOW = 120;

    public record ParsedEntry(String referenceNumber, String venue, String examTime) {}

    /**
     * @param rawText text extracted from the PDF (e.g. via PDFBox's PDFTextStripper)
     */
    public List<ParsedEntry> parse(String rawText) {
        List<ParsedEntry> entries = new ArrayList<>();
        if (rawText == null || rawText.isBlank()) return entries;

        // Collapse all whitespace (including newlines) to single spaces so that
        // rows mashed onto one line by PDF extraction and rows that legitimately
        // span line breaks are handled by the exact same logic.
        String text = rawText.replaceAll("\\s+", " ").trim();

        Matcher refMatcher = REFERENCE_NUMBER.matcher(text);
        List<int[]> refSpans = new ArrayList<>(); // [start, end] of each reference number match
        while (refMatcher.find()) {
            refSpans.add(new int[] { refMatcher.start(), refMatcher.end() });
        }

        for (int i = 0; i < refSpans.size(); i++) {
            int[] span = refSpans.get(i);
            String referenceNumber = text.substring(span[0], span[1]);

            int segmentEnd = Math.min(span[1] + VENUE_WINDOW, text.length());
            if (i + 1 < refSpans.size()) {
                segmentEnd = Math.min(segmentEnd, refSpans.get(i + 1)[0]);
            }
            if (segmentEnd <= span[1]) continue;
            String segment = text.substring(span[1], segmentEnd);

            Matcher timeMatcher = TIME.matcher(segment);
            if (!timeMatcher.find()) continue; // no time found near this reference — skip, don't guess

            String venue = segment.substring(0, timeMatcher.start()).trim();
            venue = cleanVenue(venue);
            if (venue.isEmpty()) continue;

            String examTime = normalizeTime(timeMatcher.group(1));

            entries.add(new ParsedEntry(referenceNumber, venue, examTime));
        }

        return entries;
    }

    /**
     * Pulls the exam date out of the PDF header's "DATE:" line, e.g.
     * "DATE: FRIDAY, JULY 10,, 2026" -> "FRIDAY, JULY 10, 2026". Real PDFs
     * have been seen with doubled commas/spacing, which this collapses; when
     * nothing after "DATE:" is confidently cleanable it falls back to the raw
     * captured text rather than dropping it. Returns "" when no "DATE:" line
     * is present at all — never throws.
     *
     * @param rawText text extracted from the PDF (e.g. via PDFBox's PDFTextStripper)
     */
    public String extractExamDate(String rawText) {
        if (rawText == null || rawText.isBlank()) return "";

        Matcher matcher = DATE_LINE.matcher(rawText);
        if (!matcher.find()) return "";

        String captured = matcher.group(1).trim();
        if (captured.isEmpty()) return "";

        String cleaned = captured
            .replaceAll("[,\\s]*,[,\\s]*", ", ") // collapse doubled commas/odd spacing around them
            .replaceAll("\\s+", " ")
            .trim()
            .replaceAll("[,;\\s]+$", ""); // drop a trailing comma left by the collapse

        return cleaned.isEmpty() ? captured : cleaned;
    }

    private static String cleanVenue(String venue) {
        // Strip stray leading punctuation left over from the boundary with the
        // reference number (e.g. a comma or dash that belonged to the messy
        // name/number split), then collapse any remaining double spaces.
        String cleaned = venue.replaceAll("^[\\s,._-]+", "").replaceAll("\\s{2,}", " ").trim();
        return cleaned;
    }

    private static String normalizeTime(String rawTime) {
        return rawTime.replaceAll("\\s+", "").toUpperCase();
    }
}
