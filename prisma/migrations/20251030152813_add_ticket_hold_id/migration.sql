-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "holdId" TEXT;

-- CreateIndex
CREATE INDEX "tickets_holdId_idx" ON "tickets"("holdId");
