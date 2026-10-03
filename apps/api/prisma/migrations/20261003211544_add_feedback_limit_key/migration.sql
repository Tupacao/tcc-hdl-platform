-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "limitKey" TEXT;

-- CreateIndex
CREATE INDEX "Feedback_limitKey_createdAt_idx" ON "Feedback"("limitKey", "createdAt");
