-- AlterTable
ALTER TABLE "User" ALTER COLUMN "accountType" DROP NOT NULL,
ALTER COLUMN "accountType" SET DEFAULT 'Client';
