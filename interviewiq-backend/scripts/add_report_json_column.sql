-- Run once if your database was created before `report_json` existed on interview_summaries.
ALTER TABLE interview_summaries ADD COLUMN IF NOT EXISTS report_json TEXT;
