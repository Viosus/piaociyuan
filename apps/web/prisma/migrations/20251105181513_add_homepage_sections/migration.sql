-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "icon" TEXT,
    "bgGradient" TEXT NOT NULL DEFAULT 'from-purple-50 to-pink-50',
    "moreLink" TEXT,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "type" TEXT NOT NULL DEFAULT 'manual',
    "autoConfig" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_section_events" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "eventId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homepage_section_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homepage_sections_order_idx" ON "homepage_sections"("order");

-- CreateIndex
CREATE INDEX "homepage_sections_isActive_idx" ON "homepage_sections"("isActive");

-- CreateIndex
CREATE INDEX "homepage_section_events_sectionId_idx" ON "homepage_section_events"("sectionId");

-- CreateIndex
CREATE INDEX "homepage_section_events_eventId_idx" ON "homepage_section_events"("eventId");

-- CreateIndex
CREATE INDEX "homepage_section_events_order_idx" ON "homepage_section_events"("order");

-- CreateIndex
CREATE UNIQUE INDEX "homepage_section_events_sectionId_eventId_key" ON "homepage_section_events"("sectionId", "eventId");

-- AddForeignKey
ALTER TABLE "homepage_section_events" ADD CONSTRAINT "homepage_section_events_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "homepage_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_section_events" ADD CONSTRAINT "homepage_section_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
