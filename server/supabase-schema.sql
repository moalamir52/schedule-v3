-- Clean Supabase Schema (copy and paste in Supabase SQL Editor)

-- Drop existing tables
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS "Workers" CASCADE;
DROP TABLE IF EXISTS "WashRules" CASCADE; 
DROP TABLE IF EXISTS wash_history CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;
DROP TABLE IF EXISTS "Services" CASCADE;
DROP TABLE IF EXISTS "ScheduleAuditLog" CASCADE;
DROP TABLE IF EXISTS deleted_invoices CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS "ScheduledTasks" CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- 1. customers table
CREATE TABLE customers (
  "CustomerID" TEXT PRIMARY KEY,
  "Name" TEXT,
  "Villa" TEXT,
  "Phone" TEXT,
  "Number of car" INTEGER,
  "CarPlates" TEXT,
  "Days" TEXT,
  "Time" TEXT,
  "Notes" TEXT,
  "Washman_Package" TEXT,
  "Fee" INTEGER,
  "start date" TEXT,
  "payment" TEXT,
  "Status" TEXT,
  "Serves" TEXT,
  "Serves Active" TEXT,
  "Car A" TEXT,
  "Car B" TEXT,
  "Car C" TEXT
);

-- 2. ScheduledTasks table
CREATE TABLE "ScheduledTasks" (
  "Day" TEXT,
  "AppointmentDate" TEXT,
  "Time" TEXT,
  "CustomerID" TEXT,
  "CustomerName" TEXT,
  "Villa" TEXT,
  "CarPlate" TEXT,
  "WashType" TEXT,
  "WorkerName" TEXT,
  "WorkerID" TEXT,
  "PackageType" TEXT,
  "isLocked" TEXT,
  "ScheduleDate" TEXT
);

-- 3. invoices table
CREATE TABLE invoices (
  "InvoiceID" TEXT PRIMARY KEY,
  "CustomerID" TEXT,
  "CustomerName" TEXT,
  "Villa" TEXT,
  "DueDate" TEXT,
  "TotalAmount" INTEGER,
  "Status" TEXT,
  "PaymentMethod" TEXT,
  "Start" TEXT,
  "End" TEXT,
  "Vehicle" TEXT,
  "PackageID" TEXT,
  "Notes" TEXT,
  "CreatedBy" TEXT,
  "CreatedAt" TEXT,
  "Ref" TEXT,
  "Services" TEXT
);

-- 4. Workers table
CREATE TABLE "Workers" (
  "WorkerID" TEXT,
  "Name" TEXT,
  "Job" TEXT,
  "Status" TEXT
);

-- 5. wash_history table
CREATE TABLE wash_history (
  "WashID" TEXT PRIMARY KEY,
  "CustomerID" TEXT,
  "CarPlate" TEXT,
  "WashDate" TEXT,
  "PackageType" TEXT,
  "Villa" TEXT,
  "WashTypePerformed" TEXT,
  "VisitNumberInWeek" INTEGER,
  "WeekInCycle" INTEGER,
  "Status" TEXT,
  "WorkerName" TEXT
);

-- 6. Users table
CREATE TABLE "Users" (
  "UserID" TEXT PRIMARY KEY,
  "Username" TEXT,
  "Password" TEXT,
  "Role" TEXT,
  "Status" TEXT
);

-- 7. Services table
CREATE TABLE "Services" (
  "ServiceID" TEXT,
  "ServiceName" TEXT,
  "Status" TEXT
);

-- 8. WashRules table
CREATE TABLE "WashRules" (
  "RuleId" TEXT PRIMARY KEY,
  "RuleName" TEXT,
  "SingleCarPattern" TEXT,
  "MultiCarSettings" TEXT,
  "BiWeeklySettings" TEXT,
  "CreatedDate" TEXT,
  "Status" TEXT
);

-- 9. assignments table
CREATE TABLE assignments (
  "taskId" TEXT PRIMARY KEY,
  "customerName" TEXT,
  "carPlate" TEXT,
  "washDay" TEXT,
  "washTime" TEXT,
  "washType" TEXT,
  "assignedWorker" TEXT,
  "villa" TEXT,
  "isLocked" TEXT,
  "scheduleDate" TEXT
);

-- 10. ScheduleAuditLog table
CREATE TABLE "ScheduleAuditLog" (
  "LogID" TEXT PRIMARY KEY,
  "Timestamp" TEXT,
  "UserID" TEXT,
  "UserName" TEXT,
  "Action" TEXT,
  "CustomerID" TEXT,
  "CustomerName" TEXT,
  "Villa" TEXT,
  "CarPlate" TEXT,
  "Day" TEXT,
  "Time" TEXT,
  "OldWorker" TEXT,
  "NewWorker" TEXT,
  "OldWashType" TEXT,
  "NewWashType" TEXT,
  "ChangeReason" TEXT
);

-- 11. deleted_invoices table
CREATE TABLE deleted_invoices (
  "InvoiceID" TEXT,
  "Ref" TEXT,
  "CustomerID" TEXT,
  "CustomerName" TEXT,
  "Villa" TEXT,
  "InvoiceDate" TEXT,
  "DueDate" TEXT,
  "TotalAmount" INTEGER,
  "Status" TEXT,
  "PaymentMethod" TEXT,
  "Notes" TEXT,
  "CreatedBy" TEXT,
  "CreatedAt" TEXT,
  "DeletedAt" TEXT,
  "DeletedBy" TEXT
);