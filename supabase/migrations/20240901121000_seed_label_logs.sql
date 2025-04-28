-- Seed label_logs with sample data for analytics testing
INSERT INTO label_logs (id, label_type, printed_by, food_item_id, compliance, created_at)
VALUES
  (gen_random_uuid(), 'Prep Label', NULL, 'food-1', 'Compliant', timezone('utc', now() - interval '6 days 2 hours')),
  (gen_random_uuid(), 'Consumer Label', NULL, 'food-2', 'Missing Allergen', timezone('utc', now() - interval '6 days 1 hour')),
  (gen_random_uuid(), 'Prep Label', NULL, 'food-3', 'Compliant', timezone('utc', now() - interval '5 days 3 hours')),
  (gen_random_uuid(), 'Prep Label', NULL, 'food-1', 'Compliant', timezone('utc', now() - interval '4 days 4 hours')),
  (gen_random_uuid(), 'Consumer Label', NULL, 'food-2', 'Compliant', timezone('utc', now() - interval '3 days 2 hours')),
  (gen_random_uuid(), 'Prep Label', NULL, 'food-4', 'Compliant', timezone('utc', now() - interval '2 days 1 hour')),
  (gen_random_uuid(), 'Consumer Label', NULL, 'food-5', 'Compliant', timezone('utc', now() - interval '1 days 2 hours')),
  (gen_random_uuid(), 'Prep Label', NULL, 'food-1', 'Compliant', timezone('utc', now() - interval '1 days 1 hour')),
  (gen_random_uuid(), 'Consumer Label', NULL, 'food-3', 'Compliant', timezone('utc', now() - interval '0 days 3 hours')),
  (gen_random_uuid(), 'Prep Label', NULL, 'food-2', 'Compliant', timezone('utc', now() - interval '0 days 2 hours')); 