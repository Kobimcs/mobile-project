package com.knust.classmate.labexam;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class LabExamPdfParserTest {

    private final LabExamPdfParser parser = new LabExamPdfParser();

    @Test
    void parsesBasicRowWithCommaInName() {
        String text = "483 Pa Alieu ,NJIE 21475407 MED SCH LAB 11:45AM";
        List<LabExamPdfParser.ParsedEntry> entries = parser.parse(text);

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).referenceNumber()).isEqualTo("21475407");
        assertThat(entries.get(0).venue()).isEqualTo("MED SCH LAB");
        assertThat(entries.get(0).examTime()).isEqualTo("11:45AM");
    }

    @Test
    void parsesNameWithMultipleSpacesAndComma() {
        String text = "484 David Kwadwo Frimpong  ,ABABIO 20123456 COS SF 26 10:00AM";
        List<LabExamPdfParser.ParsedEntry> entries = parser.parse(text);

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).referenceNumber()).isEqualTo("20123456");
        assertThat(entries.get(0).venue()).isEqualTo("COS SF 26");
        assertThat(entries.get(0).examTime()).isEqualTo("10:00AM");
    }

    @Test
    void parsesNameRunningDirectlyIntoReferenceNumberWithNoSpace() {
        String text = "485 ABDUL-SAME21108421 PB- SIM LAB 09:15AM";
        List<LabExamPdfParser.ParsedEntry> entries = parser.parse(text);

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).referenceNumber()).isEqualTo("21108421");
        assertThat(entries.get(0).venue()).isEqualTo("PB- SIM LAB");
        assertThat(entries.get(0).examTime()).isEqualTo("09:15AM");
    }

    @Test
    void parsesTwoRowsMashedOntoOneLineWithoutCorruptingEitherOne() {
        String text = "486 Jane Doe 20999999 ROOM A 09:00AM487 John Smith 21888888 ROOM B 10:15AM";
        List<LabExamPdfParser.ParsedEntry> entries = parser.parse(text);

        assertThat(entries).hasSize(2);
        assertThat(entries.get(0).referenceNumber()).isEqualTo("20999999");
        assertThat(entries.get(0).venue()).isEqualTo("ROOM A");
        assertThat(entries.get(0).examTime()).isEqualTo("09:00AM");

        assertThat(entries.get(1).referenceNumber()).isEqualTo("21888888");
        assertThat(entries.get(1).venue()).isEqualTo("ROOM B");
        assertThat(entries.get(1).examTime()).isEqualTo("10:15AM");
    }

    @Test
    void skipsLinesWithNoEightDigitNumber() {
        String text = "PAGE 3 OF 12 -- LAB EXAM SCHEDULE -- COMPUTER SCIENCE";
        List<LabExamPdfParser.ParsedEntry> entries = parser.parse(text);

        assertThat(entries).isEmpty();
    }

    @Test
    void doesNotMatchSevenOrNineDigitRunsAsAReferenceNumber() {
        String text = "488 Short Ref 2010745 SOME LAB 08:00AM 489 Long Ref 210107456 OTHER LAB 08:30AM";
        List<LabExamPdfParser.ParsedEntry> entries = parser.parse(text);

        assertThat(entries).isEmpty();
    }

    @Test
    void handlesFullMultiRowDocumentAcrossRealLineBreaks() {
        String text = String.join("\n",
            "483 Pa Alieu ,NJIE 21475407 MED SCH LAB 11:45AM",
            "484 David Kwadwo Frimpong ,ABABIO 20123456 COS SF 26 10:00AM",
            "485 ABDUL-SAME21108421 PB- SIM LAB 09:15AM"
        );
        List<LabExamPdfParser.ParsedEntry> entries = parser.parse(text);

        assertThat(entries).hasSize(3);
        assertThat(entries).extracting(LabExamPdfParser.ParsedEntry::referenceNumber)
            .containsExactly("21475407", "20123456", "21108421");
    }

    @Test
    void toleratesDifferentCohortPrefixesWithoutAnyAllowlist() {
        // 30xxxxxx, 22xxxxxx, 21xxxxxx, 20xxxxxx and anything else — no prefix filtering.
        String text = "1 A 30112233 LAB ONE 08:00AM 2 B 99887766 LAB TWO 08:00AM";
        List<LabExamPdfParser.ParsedEntry> entries = parser.parse(text);

        assertThat(entries).hasSize(2);
        assertThat(entries.get(0).referenceNumber()).isEqualTo("30112233");
        assertThat(entries.get(1).referenceNumber()).isEqualTo("99887766");
    }
}
