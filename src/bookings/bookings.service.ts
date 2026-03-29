import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppGateway } from '../gateway/app.gateway';
import { BookingsGateway } from '../gateway/bookings.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { SlotsService } from '../slots/slots.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private gateway: AppGateway,
    private bookingsGateway: BookingsGateway,
    private notifications: NotificationsService,
    private slots: SlotsService,
  ) {}

  // Foydalanuvchi yoki Admin booking yaratadi
  async create(userId: string, dto: CreateBookingDto) {
    const date = new Date(dto.bookingDate);
    date.setHours(0, 0, 0, 0);

    // Maydonni tekshirish
    const field = await this.prisma.field.findUnique({
      where: { id: dto.fieldId },
    });
    if (!field) throw new NotFoundException('Maydon topilmadi');

    // Admin (maydon egasi) o'zi uchun band qilayotganini tekshirish
    const isAdminBooking = field.userId === userId;

    // Slot band emasligini tekshirish
    const conflict = await this.prisma.booking.findFirst({
      where: {
        fieldId: dto.fieldId,
        bookingDate: date,
        startTime: dto.startTime,
        status: { in: ['pending', 'confirmed'] },
      },
    });
    if (conflict) throw new BadRequestException('Bu vaqt allaqachon band');

    const booking = await this.prisma.booking.create({
      data: {
        userId: isAdminBooking ? null : userId,
        fieldId: dto.fieldId,
        timeSlotId: dto.timeSlotId,
        bookingDate: date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        totalPrice: dto.totalPrice,
        note: dto.note,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        status: isAdminBooking ? 'confirmed' : 'pending',
      } as any,
      include: {
        user: true,
        field: { include: { user: true } },
      },
    });

    // Agar admin band qilgan bo'lsa — slotni darhol band qilish
    if (isAdminBooking) {
      await this.slots.markUnavailable(
        booking.fieldId,
        booking.bookingDate,
        booking.startTime,
        booking.endTime,
      );
      this.gateway.emitSlotUpdated(booking.fieldId, {
        fieldId: booking.fieldId,
        date: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        isAvailable: false,
      });
    } else {
      const b = booking as any;
      // Normal foydalanuvchi — Admin ga Socket.io xabar (AppGateway)
      this.gateway.emitNewBooking(b.field.userId, {
        id: b.id,
        userName: b.user?.fullName || dto.clientName || 'Mehmon',
        userPhone: b.user?.phone || dto.clientPhone || '',
        fieldName: b.field.name,
        bookingDate: dto.bookingDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        totalPrice: dto.totalPrice,
        status: 'pending',
        createdAt: b.createdAt,
      });

      // Admin ga Socket.io xabar (BookingsGateway)
      this.bookingsGateway.sendNewBooking(b.field.userId, {
        id: b.id,
        userName: b.user?.fullName || dto.clientName || 'Mehmon',
        fieldName: b.field.name,
        bookingDate: dto.bookingDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        totalPrice: dto.totalPrice,
        status: 'pending',
        createdAt: b.createdAt,
      });

      // Admin ga Telegram xabar
      await this.notifications.notifyAdminNewBooking(b);
    }

    return booking;
  }

  // Foydalanuvchi kelgusi bookinglari
  async getUpcoming(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.booking.findMany({
      where: {
        userId,
        bookingDate: { gte: today },
        status: { in: ['pending', 'confirmed'] },
      },
      include: { field: true },
      orderBy: { bookingDate: 'asc' },
    });
  }

  // Foydalanuvchi o'tgan bookinglari (history)
  async getHistory(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.booking.findMany({
      where: {
        userId,
        OR: [
          { bookingDate: { lt: today } },
          { status: { in: ['cancelled', 'rejected', 'completed'] } },
        ],
      },
      include: { field: true },
      orderBy: { bookingDate: 'desc' },
    });
  }

  // Foydalanuvchi faol bookinglari (bugun va hali tugamagan)
  async getActive(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.booking.findMany({
      where: {
        userId,
        bookingDate: today,
        status: 'confirmed',
      },
      include: { field: true },
    });
  }

  // Admin o'z maydon bookinglarini ko'radi
  async getAdminBookings(userId: string, status?: BookingStatus) {
    const field = await this.prisma.field.findUnique({ where: { userId } });
    if (!field) throw new NotFoundException('Maydon topilmadi');

    return this.prisma.booking.findMany({
      where: {
        fieldId: field.id,
        ...(status && { status }),
      },
      include: { user: true, field: true },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  // Superadmin barcha bookinglarni ko'radi
  async getAllBookings(status?: BookingStatus) {
    return this.prisma.booking.findMany({
      where: { ...(status && { status }) },
      include: { user: true, field: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin: tasdiqlash yoki rad etish
  async updateStatus(
    bookingId: string,
    adminUserId: string,
    dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        field: { include: { user: true } },
        user: true,
      },
    });

    if (!booking) throw new NotFoundException('Booking topilmadi');
    if (booking.field.userId !== adminUserId) {
      throw new ForbiddenException("Ruxsat yo'q");
    }
    if (booking.status !== 'pending') {
      throw new BadRequestException(
        "Faqat kutilayotgan bookingni o'zgartirish mumkin",
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: dto.status,
        rejectReason: dto.rejectReason,
        confirmedAt: dto.status === 'confirmed' ? new Date() : undefined,
        rejectedAt: dto.status === 'rejected' ? new Date() : undefined,
      },
      include: { user: true, field: { include: { user: true } } },
    });

    // Tasdiqlansa — slotni band qilish
    if (dto.status === 'confirmed') {
      await this.slots.markUnavailable(
        booking.fieldId,
        booking.bookingDate,
        booking.startTime,
        booking.endTime,
      );
      this.gateway.emitSlotUpdated(booking.fieldId, {
        fieldId: booking.fieldId,
        date: booking.bookingDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        isAvailable: false,
      });
      await this.notifications.notifyUserConfirmed(updated);
    }

    // Rad etilsa — slotni bo'shatish
    if (dto.status === 'rejected') {
      await this.slots.markAvailable(
        booking.fieldId,
        booking.bookingDate,
        booking.startTime,
        booking.endTime,
      );
      await this.notifications.notifyUserRejected(updated);
    }

    // User ga Socket.io xabar (AppGateway)
    this.gateway.emitBookingStatusChanged(booking.userId, {
      id: updated.id,
      status: updated.status,
      fieldName: updated.field.name,
      bookingDate: updated.bookingDate,
      startTime: updated.startTime,
      endTime: updated.endTime,
      rejectReason: updated.rejectReason,
    });

    // Real-time xabar (BookingsGateway)
    this.bookingsGateway.sendBookingUpdated(booking.userId, booking.field.userId, {
      id: updated.id,
      status: updated.status,
      fieldName: updated.field.name,
      bookingDate: updated.bookingDate,
      startTime: updated.startTime,
      endTime: updated.endTime,
      rejectReason: updated.rejectReason,
    });

    return updated;
  }

  // Foydalanuvchi bekor qiladi
  async cancel(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking topilmadi');
    if (booking.userId !== userId) throw new ForbiddenException("Ruxsat yo'q");
    if (!['pending', 'confirmed'].includes(booking.status)) {
      throw new BadRequestException("Bu bookingni bekor qilib bo'lmaydi");
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });

    if (booking.status === 'confirmed') {
      await this.slots.markAvailable(
        booking.fieldId,
        booking.bookingDate,
        booking.startTime,
        booking.endTime,
      );
    }

    return updated;
  }
}
