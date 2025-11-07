-- SQLite Database Schema for Schedule Management System

-- Customers table (exact Google Sheets field names)
CREATE TABLE customers (
    CustomerID TEXT PRIMARY KEY COLLATE NOCASE,
    Name TEXT NOT NULL COLLATE NOCASE,
    Villa TEXT COLLATE NOCASE,
    CarPlates TEXT COLLATE NOCASE,
    Washman_Package TEXT COLLATE NOCASE,
    Days TEXT COLLATE NOCASE,
    Time TEXT,
    Status TEXT DEFAULT 'Active' COLLATE NOCASE,
    Phone TEXT,
    Email TEXT COLLATE NOCASE,
    Notes TEXT,
    Fee REAL,
    `Number of car` INTEGER,
    `start date` TEXT
);

-- Wash history table (exact Google Sheets field names)
CREATE TABLE wash_history (
    WashID TEXT PRIMARY KEY COLLATE NOCASE,
    CustomerID TEXT COLLATE NOCASE,
    CarPlate TEXT COLLATE NOCASE,
    WashDate TEXT,
    PackageType TEXT COLLATE NOCASE,
    Villa TEXT COLLATE NOCASE,
    WashTypePerformed TEXT COLLATE NOCASE,
    VisitNumberInWeek INTEGER,
    WeekInCycle INTEGER,
    Status TEXT COLLATE NOCASE,
    WorkerName TEXT COLLATE NOCASE
);

-- Workers table (exact Google Sheets field names)
CREATE TABLE workers (
    WorkerID TEXT COLLATE NOCASE,
    Name TEXT NOT NULL COLLATE NOCASE,
    Phone TEXT,
    Status TEXT DEFAULT 'Active' COLLATE NOCASE,
    Specialization TEXT COLLATE NOCASE,
    HourlyRate REAL
);

-- Scheduled tasks table (exact Google Sheets field names)
CREATE TABLE ScheduledTasks (
    Day TEXT COLLATE NOCASE,
    AppointmentDate TEXT,
    Time TEXT,
    CustomerID TEXT COLLATE NOCASE,
    CustomerName TEXT COLLATE NOCASE,
    Villa TEXT COLLATE NOCASE,
    CarPlate TEXT COLLATE NOCASE,
    WashType TEXT COLLATE NOCASE,
    WorkerName TEXT COLLATE NOCASE,
    WorkerID TEXT COLLATE NOCASE,
    PackageType TEXT COLLATE NOCASE,
    isLocked TEXT DEFAULT 'FALSE' COLLATE NOCASE,
    ScheduleDate TEXT
);

-- Invoices table (exact Google Sheets field names)
CREATE TABLE invoices (
    InvoiceID TEXT PRIMARY KEY COLLATE NOCASE,
    Ref TEXT UNIQUE COLLATE NOCASE,
    CustomerID TEXT COLLATE NOCASE,
    CustomerName TEXT COLLATE NOCASE,
    Villa TEXT COLLATE NOCASE,
    InvoiceDate TEXT,
    DueDate TEXT,
    TotalAmount REAL,
    Status TEXT DEFAULT 'Pending' COLLATE NOCASE,
    PaymentMethod TEXT COLLATE NOCASE,
    Start TEXT,
    End TEXT,
    Vehicle TEXT COLLATE NOCASE,
    PackageID TEXT COLLATE NOCASE,
    Services TEXT,
    Notes TEXT,
    CreatedBy TEXT COLLATE NOCASE,
    CreatedAt TEXT,
    SubTotal REAL,
    Phone TEXT,
    Payment TEXT,
    Subject TEXT
);

-- Users table (exact Google Sheets field names)
CREATE TABLE Users (
    UserID TEXT PRIMARY KEY COLLATE NOCASE,
    Username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    Password TEXT NOT NULL,
    PlainPassword TEXT,
    Role TEXT NOT NULL COLLATE NOCASE,
    Status TEXT DEFAULT 'Active' COLLATE NOCASE,
    CreatedAt TEXT
);

-- Services table (exact Google Sheets field names)
CREATE TABLE Services (
    ServiceID TEXT COLLATE NOCASE,
    ServiceName TEXT NOT NULL COLLATE NOCASE,
    Price REAL,
    Description TEXT,
    Status TEXT DEFAULT 'Active' COLLATE NOCASE
);

-- Audit log table (exact Google Sheets field names)
CREATE TABLE ScheduleAuditLog (
    LogID TEXT PRIMARY KEY COLLATE NOCASE,
    Timestamp TEXT,
    UserID TEXT COLLATE NOCASE,
    UserName TEXT COLLATE NOCASE,
    Action TEXT COLLATE NOCASE,
    CustomerID TEXT COLLATE NOCASE,
    CustomerName TEXT COLLATE NOCASE,
    Villa TEXT COLLATE NOCASE,
    CarPlate TEXT COLLATE NOCASE,
    Day TEXT COLLATE NOCASE,
    Time TEXT,
    OldWorker TEXT COLLATE NOCASE,
    NewWorker TEXT COLLATE NOCASE,
    OldWashType TEXT COLLATE NOCASE,
    NewWashType TEXT COLLATE NOCASE,
    ChangeReason TEXT
);

-- Wash rules table (exact Google Sheets field names)
CREATE TABLE WashRules (
    RuleId TEXT PRIMARY KEY COLLATE NOCASE,
    RuleName TEXT NOT NULL COLLATE NOCASE,
    SingleCarPattern TEXT,
    MultiCarSettings TEXT,
    BiWeeklySettings TEXT,
    CreatedDate TEXT,
    Status TEXT DEFAULT 'Active' COLLATE NOCASE
);

-- Deleted invoices table (exact Google Sheets field names)
CREATE TABLE deleted_invoices (
    InvoiceID TEXT COLLATE NOCASE,
    Ref TEXT COLLATE NOCASE,
    CustomerID TEXT COLLATE NOCASE,
    CustomerName TEXT COLLATE NOCASE,
    Villa TEXT COLLATE NOCASE,
    InvoiceDate TEXT,
    DueDate TEXT,
    TotalAmount REAL,
    Status TEXT COLLATE NOCASE,
    PaymentMethod TEXT COLLATE NOCASE,
    Notes TEXT,
    CreatedBy TEXT COLLATE NOCASE,
    CreatedAt TEXT,
    DeletedAt TEXT,
    DeletedBy TEXT COLLATE NOCASE
);

-- Assignments table for drag & drop functionality
CREATE TABLE assignments (
    taskId TEXT PRIMARY KEY COLLATE NOCASE,
    customerName TEXT COLLATE NOCASE,
    carPlate TEXT COLLATE NOCASE,
    washDay TEXT COLLATE NOCASE,
    washTime TEXT,
    washType TEXT COLLATE NOCASE,
    assignedWorker TEXT COLLATE NOCASE,
    villa TEXT COLLATE NOCASE,
    isLocked TEXT DEFAULT 'FALSE' COLLATE NOCASE,
    scheduleDate TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(Status);
CREATE INDEX IF NOT EXISTS idx_assignments_customer ON assignments(customerName);
CREATE INDEX IF NOT EXISTS idx_assignments_worker ON assignments(assignedWorker);
CREATE INDEX IF NOT EXISTS idx_wash_history_customer ON wash_history(CustomerID);
CREATE INDEX IF NOT EXISTS idx_wash_history_car ON wash_history(CarPlate);
CREATE INDEX IF NOT EXISTS idx_wash_history_date ON wash_history(WashDate);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_customer ON ScheduledTasks(CustomerID);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_date ON ScheduledTasks(AppointmentDate);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(CustomerID);
CREATE INDEX IF NOT EXISTS idx_invoices_ref ON invoices(Ref);
-- CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(InvoiceDate);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON ScheduleAuditLog(Timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_customer ON ScheduleAuditLog(CustomerID);