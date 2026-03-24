-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin', 'superadmin');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'click', 'payme');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('basic', 'pro', 'unlimited');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('booking_pending', 'booking_confirmed', 'booking_rejected', 'booking_cancelled', 'subscription_expiry');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT 'Toshkent',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "price_per_hour" INTEGER NOT NULL DEFAULT 0,
    "size" TEXT,
    "surface" TEXT,
    "description" TEXT,
    "amenities" TEXT[],
    "images" TEXT[],
    "open_time" TEXT NOT NULL DEFAULT '08:00',
    "close_time" TEXT NOT NULL DEFAULT '23:00',
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_slots" (
    "id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "slot_date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "booking_date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "total_price" INTEGER NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'cash',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "reject_reason" TEXT,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'basic',
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "booking_id" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_login_key" ON "users"("login");

-- CreateIndex
CREATE UNIQUE INDEX "fields_user_id_key" ON "fields"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_field_id_slot_date_start_time_key" ON "time_slots"("field_id", "slot_date", "start_time");

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
