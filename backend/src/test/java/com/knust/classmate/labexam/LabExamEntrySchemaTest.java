package com.knust.classmate.labexam;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Not a behavior test — this exists purely to print/verify the exact table and
 * column names Hibernate's default naming strategy generates for LabExamEntry
 * under ddl-auto=update, using an in-memory H2 database (never touches the
 * real Postgres instance).
 */
@DataJpaTest
class LabExamEntrySchemaTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void reportsGeneratedTableAndColumnNames() {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList(
            "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS " +
            "WHERE TABLE_NAME = 'LAB_EXAM_ENTRIES' ORDER BY ORDINAL_POSITION");
        System.out.println("=== lab_exam_entries columns ===");
        columns.forEach(System.out::println);
        assertThat(columns).isNotEmpty();

        List<Map<String, Object>> indexes = jdbcTemplate.queryForList(
            "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.INDEXES " +
            "WHERE TABLE_NAME = 'LAB_EXAM_ENTRIES'");
        System.out.println("=== lab_exam_entries indexes ===");
        indexes.forEach(System.out::println);
        assertThat(indexes)
            .anyMatch(row -> "IDX_LAB_EXAM_COURSE_REFERENCE".equalsIgnoreCase(String.valueOf(row.get("INDEX_NAME"))));
    }
}
