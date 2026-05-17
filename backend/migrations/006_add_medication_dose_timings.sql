ALTER TABLE patient_medications
ADD COLUMN IF NOT EXISTS dosage_schedule JSONB;

ALTER TABLE medication_logs
ADD COLUMN IF NOT EXISTS dose_period VARCHAR(20),
ADD COLUMN IF NOT EXISTS dose_dosage TEXT,
ADD COLUMN IF NOT EXISTS missed_alert_sent BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_medication_logs_patient_status_time
ON medication_logs (patient_user_id, status, scheduled_time);
