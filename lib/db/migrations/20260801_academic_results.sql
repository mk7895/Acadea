BEGIN;

CREATE TABLE IF NOT EXISTS platform_academic_results (
  id serial PRIMARY KEY,
  mentee_user_id integer NOT NULL REFERENCES platform_users(id) ON DELETE CASCADE,
  gpa_value numeric(5, 2),
  gpa_scale numeric(5, 2),
  sat_total integer,
  sat_reading_writing integer,
  sat_math integer,
  sat_test_date text,
  ielts_overall numeric(2, 1),
  ielts_listening numeric(2, 1),
  ielts_reading numeric(2, 1),
  ielts_writing numeric(2, 1),
  ielts_speaking numeric(2, 1),
  ielts_test_date text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT platform_academic_results_gpa_check CHECK (
    (gpa_value IS NULL AND gpa_scale IS NULL)
    OR (gpa_value IS NOT NULL AND gpa_scale IS NOT NULL AND gpa_value >= 0 AND gpa_scale > 0 AND gpa_value <= gpa_scale)
  ),
  CONSTRAINT platform_academic_results_sat_total_check CHECK (sat_total IS NULL OR sat_total BETWEEN 400 AND 1600),
  CONSTRAINT platform_academic_results_sat_reading_check CHECK (sat_reading_writing IS NULL OR sat_reading_writing BETWEEN 200 AND 800),
  CONSTRAINT platform_academic_results_sat_math_check CHECK (sat_math IS NULL OR sat_math BETWEEN 200 AND 800),
  CONSTRAINT platform_academic_results_ielts_overall_check CHECK (ielts_overall IS NULL OR ielts_overall BETWEEN 0 AND 9),
  CONSTRAINT platform_academic_results_ielts_listening_check CHECK (ielts_listening IS NULL OR ielts_listening BETWEEN 0 AND 9),
  CONSTRAINT platform_academic_results_ielts_reading_check CHECK (ielts_reading IS NULL OR ielts_reading BETWEEN 0 AND 9),
  CONSTRAINT platform_academic_results_ielts_writing_check CHECK (ielts_writing IS NULL OR ielts_writing BETWEEN 0 AND 9),
  CONSTRAINT platform_academic_results_ielts_speaking_check CHECK (ielts_speaking IS NULL OR ielts_speaking BETWEEN 0 AND 9)
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_academic_results_mentee_unique
  ON platform_academic_results (mentee_user_id);

COMMIT;
