-- CreateEnum
CREATE TYPE "VideoType" AS ENUM ('YOUTUBE', 'VIMEO', 'UPLOAD');

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "pdfUrl" TEXT,
ADD COLUMN     "videoType" "VideoType";
