/*
  Warnings:

  - A unique constraint covering the columns `[time_slot_id]` on the table `bookings` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_user_id_fkey";

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "client_name" TEXT,
ADD COLUMN     "client_phone" TEXT,
ADD COLUMN     "time_slot_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "fields" ADD COLUMN     "slot_duration" INTEGER NOT NULL DEFAULT 60;

-- CreateIndex
CREATE UNIQUE INDEX "bookings_time_slot_id_key" ON "bookings"("time_slot_id");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_time_slot_id_fkey" FOREIGN KEY ("time_slot_id") REFERENCES "time_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
