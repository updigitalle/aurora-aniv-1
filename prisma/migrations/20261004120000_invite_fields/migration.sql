-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "revealLocationAfterRsvp" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "rsvpDeadline" TIMESTAMP(3),
ADD COLUMN     "timeConfirmed" BOOLEAN NOT NULL DEFAULT false;

