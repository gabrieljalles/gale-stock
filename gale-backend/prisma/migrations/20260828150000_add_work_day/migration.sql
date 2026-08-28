CREATE TABLE "WorkDay" (
    "id" TEXT NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openedBy" TEXT,
    "closedBy" TEXT,

    CONSTRAINT "WorkDay_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order" ADD COLUMN "workDayId" TEXT;

ALTER TABLE "Order" ADD CONSTRAINT "Order_workDayId_fkey" FOREIGN KEY ("workDayId") REFERENCES "WorkDay"("id") ON DELETE SET NULL ON UPDATE CASCADE;
