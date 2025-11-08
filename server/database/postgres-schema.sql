-- PostgreSQL Schema for Schedule Management System

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    "CustomerID" TEXT PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "Villa" TEXT,
    "CarPlates" TEXT,
    "Washman_Package" TEXT,
    "Days" TEXT,
    "Time" TEXT,
    "Status" TEXT DEFAULT 'Active',
    "Phone" TEXT,
    "Email" TEXT,
    "Notes" TEXT,
    "Fee" REAL,
    "Number of car" INTEGER,
    "start date" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workers table
CREATE TABLE IF NOT EXISTS workers (
    "WorkerID" TEXT PRIMARY KEY,
    "Name" TEXT NOT NULL,
    "Job" TEXT,
    "Phone" TEXT,
    "Status" TEXT DEFAULT 'Active',
    "Specialization" TEXT,
    "HourlyRate" REAL
);

-- Wash history table
CREATE TABLE IF NOT EXISTS wash_history (
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

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    "InvoiceID" TEXT PRIMARY KEY,
    "Ref" TEXT UNIQUE,
    "CustomerID" TEXT,
    "CustomerName" TEXT,
    "Villa" TEXT,
    "InvoiceDate" DATE,
    "DueDate" DATE,
    "TotalAmount" REAL,
    "Status" TEXT DEFAULT 'Pending',
    "PaymentMethod" TEXT,
    "Start" TEXT,
    "End" TEXT,
    "Vehicle" TEXT,
    "PackageID" TEXT,
    "Services" TEXT,
    "Notes" TEXT,
    "CreatedBy" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "SubTotal" REAL,
    "Phone" TEXT,
    "Payment" TEXT,
    "Subject" TEXT
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services table
CREATE TABLE IF NOT EXISTS "Services" (
    "ServiceID" TEXT PRIMARY KEY,
    "ServiceName" TEXT NOT NULL,
    "Price" REAL,
    "Description" TEXT,
    "Status" TEXT DEFAULT 'Active'
);

-- Scheduled tasks table
CREATE TABLE IF NOT EXISTS "ScheduledTasks" (
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
    "isLocked" TEXT DEFAULT 'FALSE',
    "ScheduleDate" TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers("Status");
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices("CustomerID");
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices("InvoiceDate");
CREATE INDEX IF NOT EXISTS idx_wash_history_customer ON wash_history("CustomerID");
CREATE INDEX IF NOT EXISTS idx_wash_history_car ON wash_history("CarPlate");