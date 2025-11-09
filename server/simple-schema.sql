-- Simple Supabase Schema (no quotes, simple names)

DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS workers CASCADE;

-- customers table with simple column names
CREATE TABLE customers (
  customer_id TEXT PRIMARY KEY,
  name TEXT,
  villa TEXT,
  phone TEXT,
  number_of_cars INTEGER,
  car_plates TEXT,
  days TEXT,
  time TEXT,
  notes TEXT,
  package TEXT,
  fee INTEGER,
  start_date TEXT,
  payment TEXT,
  status TEXT,
  serves TEXT,
  serves_active TEXT,
  car_a TEXT,
  car_b TEXT,
  car_c TEXT
);

-- workers table
CREATE TABLE workers (
  worker_id TEXT,
  name TEXT,
  job TEXT,
  status TEXT
);