-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('local', 'youtube');

-- CreateTable
CREATE TABLE "History" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "platform" "PlatformType" NOT NULL DEFAULT 'local',
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "channelName" TEXT NOT NULL,
    "uploadedById" UUID,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "firstWatchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "watchCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "History_userId_idx" ON "History"("userId");

-- CreateIndex
CREATE INDEX "History_watchedAt_idx" ON "History"("watchedAt");

-- CreateIndex
CREATE INDEX "History_userId_watchedAt_idx" ON "History"("userId", "watchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "History_userId_videoId_platform_key" ON "History"("userId", "videoId", "platform");

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
