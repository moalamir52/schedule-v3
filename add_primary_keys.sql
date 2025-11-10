-- Check tables without primary keys
SELECT t.table_name
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc 
  ON t.table_name = tc.table_name 
  AND tc.constraint_type = 'PRIMARY KEY'
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND tc.table_name IS NULL;

-- Add primary keys only to tables that don't have them
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT t.table_name
        FROM information_schema.tables t
        LEFT JOIN information_schema.table_constraints tc 
          ON t.table_name = tc.table_name 
          AND tc.constraint_type = 'PRIMARY KEY'
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
          AND tc.table_name IS NULL
    LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN id SERIAL PRIMARY KEY', table_record.table_name);
    END LOOP;
END $$;