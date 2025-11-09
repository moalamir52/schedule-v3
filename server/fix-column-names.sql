-- Fix Supabase column names to match CSV (remove quotes)

-- Fix customers table
ALTER TABLE customers RENAME COLUMN "CustomerID" TO CustomerID;
ALTER TABLE customers RENAME COLUMN "Name" TO Name;
ALTER TABLE customers RENAME COLUMN "Villa" TO Villa;
ALTER TABLE customers RENAME COLUMN "Phone" TO Phone;
ALTER TABLE customers RENAME COLUMN "Number of car" TO "Number of car";
ALTER TABLE customers RENAME COLUMN "CarPlates" TO CarPlates;
ALTER TABLE customers RENAME COLUMN "Days" TO Days;
ALTER TABLE customers RENAME COLUMN "Time" TO Time;
ALTER TABLE customers RENAME COLUMN "Notes" TO Notes;
ALTER TABLE customers RENAME COLUMN "Washman_Package" TO Washman_Package;
ALTER TABLE customers RENAME COLUMN "Fee" TO Fee;
ALTER TABLE customers RENAME COLUMN "start date" TO "start date";
ALTER TABLE customers RENAME COLUMN "payment" TO payment;
ALTER TABLE customers RENAME COLUMN "Status" TO Status;
ALTER TABLE customers RENAME COLUMN "Serves" TO Serves;
ALTER TABLE customers RENAME COLUMN "Serves Active" TO "Serves Active";
ALTER TABLE customers RENAME COLUMN "Car A" TO "Car A";
ALTER TABLE customers RENAME COLUMN "Car B" TO "Car B";
ALTER TABLE customers RENAME COLUMN "Car C" TO "Car C";

-- Fix Workers table
ALTER TABLE "Workers" RENAME COLUMN "WorkerID" TO WorkerID;
ALTER TABLE "Workers" RENAME COLUMN "Name" TO Name;
ALTER TABLE "Workers" RENAME COLUMN "Job" TO Job;
ALTER TABLE "Workers" RENAME COLUMN "Status" TO Status;