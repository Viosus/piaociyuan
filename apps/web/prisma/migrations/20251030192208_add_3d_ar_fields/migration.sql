-- AlterTable
ALTER TABLE "badges" ADD COLUMN     "animationUrl" TEXT,
ADD COLUMN     "arUrl" TEXT,
ADD COLUMN     "has3DModel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasAR" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasAnimation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "model3DUrl" TEXT,
ADD COLUMN     "modelConfig" TEXT,
ADD COLUMN     "modelFormat" TEXT;

-- CreateIndex
CREATE INDEX "badges_has3DModel_idx" ON "badges"("has3DModel");

-- CreateIndex
CREATE INDEX "badges_hasAR_idx" ON "badges"("hasAR");
