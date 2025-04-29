-- Migration: Create sensor_events table for DT integration
CREATE TABLE IF NOT EXISTS sensor_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id text NOT NULL,
    event_type text NOT NULL,
    event_value jsonb,
    event_timestamp timestamp with time zone NOT NULL,
    raw_payload jsonb,
    form_submission_id uuid REFERENCES form_submissions(id) ON DELETE SET NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Index for fast queries by event_timestamp
CREATE INDEX IF NOT EXISTS idx_sensor_events_event_timestamp ON sensor_events (event_timestamp DESC);

-- Index for sensor_id
CREATE INDEX IF NOT EXISTS idx_sensor_events_sensor_id ON sensor_events (sensor_id); 