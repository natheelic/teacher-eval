-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dismissedAnnouncementId" TEXT;

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Announcement_active_idx" ON "Announcement"("active");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_dismissedAnnouncementId_fkey" FOREIGN KEY ("dismissedAnnouncementId") REFERENCES "Announcement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
