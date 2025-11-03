-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "seatNumber" TEXT;

-- CreateIndex
CREATE INDEX "tickets_eventId_tierId_status_seatNumber_idx" ON "tickets"("eventId", "tierId", "status", "seatNumber");
