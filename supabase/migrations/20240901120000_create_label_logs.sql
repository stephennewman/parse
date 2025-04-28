-- Migration: Create label_logs table for label print tracking
CREATE TABLE IF NOT EXISTS label_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    label_type text NOT NULL,
    printed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    food_item_id uuid,
    compliance text,
    created_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Optional: Index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_label_logs_created_at ON label_logs (created_at DESC);

-- Optional: Index for label_type
CREATE INDEX IF NOT EXISTS idx_label_logs_label_type ON label_logs (label_type); 