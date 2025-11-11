-- جدول العملاء المتخطين
CREATE TABLE IF NOT EXISTS "SkippedCustomers" (
    "SkippedID" TEXT PRIMARY KEY,
    "CustomerID" TEXT NOT NULL,
    "CustomerName" TEXT,
    "Villa" TEXT,
    "CarPlate" TEXT,
    "ScheduledDay" TEXT,
    "ScheduledTime" TEXT,
    "SkipReason" TEXT,
    "WeekOffset" INTEGER DEFAULT 0,
    "SkippedDate" DATE,
    "Status" TEXT DEFAULT 'Skipped',
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);