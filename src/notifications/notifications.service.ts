import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import TelegramBot from 'node-telegram-bot-api';

type BookingWithRelations = {
  id: string;
  bookingDate: Date;
  startTime: string;
  endTime: string;
  totalPrice: number;
  rejectReason?: string | null;
  user: {
    fullName: string;
    // login?: string;
  };
  field: {
    name: string;
    user: {
      fullName: string;
    };
  };
};

@Injectable()
export class NotificationsService {
  private bot: TelegramBot | null = null;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    // Telegram bot hozircha o'chirilgan yoki keyinchalik qayta ko'rib chiqiladi
    this.logger.warn('Telegram xabarnomalari hozircha faol emas (login/password tizimi)');
  }

  private async send(id: string, text: string) {
    // Hozircha xabar yubormaymiz, chunki telegramId yo'q
    this.logger.log(`[Notification Mock] To: ${id}, Text: ${text}`);
  }

  // Admin ga: yangi booking keldi
  async notifyAdminNewBooking(booking: BookingWithRelations) {
    const text =
      `🔔 <b>Yangi band qilish so'rovi!</b>\n\n` +
      `👤 <b>Mijoz:</b> ${booking.user.fullName}\n` +
      `🏟 <b>Maydon:</b> ${booking.field.name}\n` +
      `📅 <b>Sana:</b> ${new Date(booking.bookingDate).toLocaleDateString('uz-UZ')}\n` +
      `⏰ <b>Vaqt:</b> ${booking.startTime}–${booking.endTime}\n` +
      `💰 <b>Narx:</b> ${booking.totalPrice.toLocaleString()} so'm\n\n` +
      `GoBron Admin ilovasida tasdiqlang yoki rad eting.`;

    await this.send(booking.field.user.fullName, text);
  }

  // User ga: booking tasdiqlandi
  async notifyUserConfirmed(booking: BookingWithRelations) {
    const text =
      `✅ <b>Bandlik tasdiqlandi!</b>\n\n` +
      `🏟 <b>Maydon:</b> ${booking.field.name}\n` +
      `📅 <b>Sana:</b> ${new Date(booking.bookingDate).toLocaleDateString('uz-UZ')}\n` +
      `⏰ <b>Vaqt:</b> ${booking.startTime}–${booking.endTime}\n` +
      `💰 <b>To'lov:</b> ${booking.totalPrice.toLocaleString()} so'm (naqd)\n\n` +
      `Vaqtida keling! ⚽`;

    await this.send(booking.user.fullName, text);
  }

  // User ga: booking rad etildi
  async notifyUserRejected(booking: BookingWithRelations) {
    const text =
      `❌ <b>Bandlik rad etildi</b>\n\n` +
      `🏟 <b>Maydon:</b> ${booking.field.name}\n` +
      `📅 <b>Sana:</b> ${new Date(booking.bookingDate).toLocaleDateString('uz-UZ')}\n` +
      `⏰ <b>Vaqt:</b> ${booking.startTime}–${booking.endTime}\n` +
      `${booking.rejectReason ? `\n📝 <b>Sabab:</b> ${booking.rejectReason}\n` : ''}` +
      `\nBoshqa vaqtni tanlashingiz mumkin.`;

    await this.send(booking.user.fullName, text);
  }

  // User: o'z xabarnomalarni ko'rish
  async getMyNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // User: xabarnomani o'qilgan qilish
  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!notification) throw new NotFoundException('Xabarnoma topilmadi');
    if (notification.userId !== userId) throw new Error("Ruxsat yo'q");

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // Admin: bookingga xabar yuborish
  async sendBookingNotification(
    bookingId: string,
    adminUserId: string,
    message: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, field: { include: { user: true } } },
    });
    if (!booking) throw new NotFoundException('Booking topilmadi');
    if (booking.field.userId !== adminUserId) throw new Error("Ruxsat yo'q");

    const notification = await this.prisma.notification.create({
      data: {
        userId: booking.userId,
        bookingId,
        type: 'booking_pending',
        title: 'Admin xabari',
        message,
      },
    });

    await this.send(booking.user.fullName, message);
    return notification;
  }
}
