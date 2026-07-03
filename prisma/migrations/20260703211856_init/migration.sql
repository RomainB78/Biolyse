-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "age" INTEGER NOT NULL,
    "sex" TEXT NOT NULL,
    "height" REAL NOT NULL,
    "weight" REAL NOT NULL,
    "activityLevel" TEXT NOT NULL,
    "lifestyle" TEXT NOT NULL,
    "healthGoals" TEXT NOT NULL,
    "medicalHistory" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BloodReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "labName" TEXT NOT NULL,
    "healthScore" INTEGER NOT NULL,
    "scoreClass" TEXT NOT NULL,
    "insightSummary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BloodReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportBiomarker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rawValue" REAL NOT NULL,
    "rawUnit" TEXT NOT NULL,
    "valG_L" REAL,
    "valMmol_L" REAL,
    "refMin" REAL,
    "refMax" REAL,
    "flag" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "explanation" TEXT,
    CONSTRAINT "ReportBiomarker_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "BloodReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
