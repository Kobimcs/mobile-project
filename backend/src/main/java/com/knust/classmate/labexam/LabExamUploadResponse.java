package com.knust.classmate.labexam;

/** Lets the rep sanity-check the parse before trusting it — the count IS the review signal. */
public record LabExamUploadResponse(String courseCode, int entriesParsed, int entriesSaved) {}
