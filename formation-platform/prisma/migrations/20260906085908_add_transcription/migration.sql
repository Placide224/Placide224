-- CreateEnum
CREATE TYPE "TranscriptionSource" AS ENUM ('UPLOAD', 'RECORDING');

-- CreateTable
CREATE TABLE "Transcription" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" "TranscriptionSource" NOT NULL DEFAULT 'UPLOAD',
    "tempo" DOUBLE PRECISION NOT NULL,
    "key" TEXT NOT NULL,
    "durationSec" DOUBLE PRECISION NOT NULL,
    "notes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,

    CONSTRAINT "Transcription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transcription_creatorId_idx" ON "Transcription"("creatorId");

-- AddForeignKey
ALTER TABLE "Transcription" ADD CONSTRAINT "Transcription_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
