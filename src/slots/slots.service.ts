import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/uz-latn';
import { BookSlotDto } from './dto/book-slot.dto';

dayjs.extend(utc);
dayjs.extend(timezone);

// O'zbekiston vaqti bilan ishlash
const UZ_TIMEZONE = 'Asia/Tashkent';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Slotni band qilish (Book)
   */
  async bookSlot(userId: string, dto: BookSlotDto) {
    try {
      // 1. Slotni topish
      const slot = await (this.prisma as any).timeSlot.findUnique({
        where: { id: dto.slotId },
        include: { field: true },
      });

      if (!slot) {
        throw new NotFoundException('Slot topilmadi');
      }

      if (!slot.isAvailable) {
        throw new BadRequestException('Bu slot allaqachon band qilingan');
      }

      // 2. Booking yaratish
      // Agar dto da fieldId/date/time berilmagan bo'lsa, slotdan olamiz
      const fieldId = dto.fieldId || slot.fieldId;
      const startTime = dto.startTime || slot.startTime;
      const endTime = dto.endTime || slot.endTime;
      const bookingDate = dto.date ? new Date(dto.date) : slot.slotDate;
      
      // Narxni hisoblash (1 soat deb hisoblaymiz, chunki slotlar soatlik)
      const totalPrice = slot.field.pricePerHour;

      const booking = await (this.prisma as any).booking.create({
        data: {
          userId,
          fieldId,
          timeSlotId: slot.id,
          bookingDate,
          startTime,
          endTime,
          totalPrice,
          status: 'confirmed', // Foydalanuvchi so'raganidek confirmed
        } as any,
      });

      // 3. Slotni band qilingan deb belgilash
      await (this.prisma as any).timeSlot.update({
        where: { id: slot.id },
        data: { isAvailable: false },
      });

      const b = booking as any;
      return {
        success: true,
        message: 'Slot muvaffaqiyatli band qilindi',
        booking: {
          id: b.id,
          slotId: b.timeSlotId,
          userId: b.userId,
          status: b.status,
          createdAt: b.createdAt,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('bookSlot error:', error.message);
      throw new BadRequestException('Slotni band qilishda xatolik yuz berdi: ' + error.message);
    }
  }

  /**
   * Main method to get slots for a field.
   * Automatically generates slots for the next 3 days (today, tomorrow, day after)
   * or a specific date if provided.
   */
  async getSlots(fieldId: string, date?: string) {
    try {
      // Local (Uzbekistan) vaqt bilan ishlash
      const now = dayjs().tz(UZ_TIMEZONE);
      const today = now.startOf('day');
      const targetDates: dayjs.Dayjs[] = [];

      if (date) {
        // Agar maxsus sana so'ralgan bo'lsa
        const requestedDate = dayjs.tz(date, UZ_TIMEZONE).startOf('day');
        if (!requestedDate.isValid()) {
          throw new Error('Sana formati noto\'g\'ri. YYYY-MM-DD formatidan foydalaning');
        }
        targetDates.push(requestedDate);
      } else {
        // Agar sana berilmasa, Bugun + 2 kun (jami 3 kun)
        for (let i = 0; i < 3; i++) {
          targetDates.push(today.add(i, 'day'));
        }
      }

      const field = await (this.prisma as any).field.findUnique({ where: { id: fieldId } });
      if (!field) throw new Error('Maydon topilmadi');

      // Slotlarni generatsiya qilish (agar bazada bo'lmasa)
      for (const d of targetDates) {
        // Bazaga DATE tipida saqlash uchun UTC midnight Date ob'ekti kerak
        const dateForDb = new Date(d.format('YYYY-MM-DD'));
        await this.generateSlotsForField(fieldId, dateForDb);
      }

      // Barcha so'ralgan kunlar uchun slotlarni bazadan olamiz
      const allSlots = await (this.prisma as any).timeSlot.findMany({
        where: {
          fieldId,
          slotDate: {
            in: targetDates.map((d) => new Date(d.format('YYYY-MM-DD'))),
          },
        },
        orderBy: { startTime: 'asc' },
      });

      const resultDates = targetDates.map((d) => {
        const dateStr = d.format('YYYY-MM-DD');
        const isToday = d.isSame(today, 'day');

        let label = '';
        if (isToday) label = 'Bugun';
        else if (d.isSame(today.add(1, 'day'), 'day')) label = 'Ertaga';
        else {
          const monthNames = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
          label = `${d.date()} ${monthNames[d.month()]}`;
        }

        // DB dan kelgan slotlarni ushbu kunga tegishli ekanligini tekshiramiz
        // Prisma @db.Date ni UTC midnight Date qilib qaytaradi
        let daySlots = allSlots.filter((s: any) => {
          const sDateStr = dayjs.utc(s.slotDate).format('YYYY-MM-DD');
          return sDateStr === dateStr;
        });

        // Bugun uchun faqat hozirgi vaqtdan keyingi slotlarni ko'rsatamiz
        if (isToday) {
          daySlots = daySlots.filter((s: any) => {
            const [h, m] = s.startTime.split(':').map(Number);
            // Slot boshlanish vaqti (Uzbekistan vaqti bilan)
            const slotStartTime = d.hour(h).minute(m).second(0);
            return slotStartTime.isAfter(now);
          });
        }

        return {
          date: dateStr,
          dayLabel: label,
          slots: daySlots.map((s: any) => ({
            id: s.id,
            startTime: s.startTime,
            endTime: s.endTime,
            isAvailable: s.isAvailable,
          })),
        };
      });

      return { dates: resultDates };
    } catch (error: any) {
      console.error('getSlots error:', error.message);
      throw error;
    }
  }

  /**
   * Generates hourly slots for a field if they don't already exist.
   */
  async generateSlotsForField(fieldId: string, date: Date) {
    try {
      const field = await (this.prisma as any).field.findUnique({
        where: { id: fieldId },
      });
      if (!field) return;

      // date allaqachon UTC midnight Date (new Date('YYYY-MM-DD')) bo'lishi kerak
      const slotDate = date;

      // Agar bu kun uchun slotlar allaqachon mavjud bo'lsa, qaytamiz
      const existingCount = await (this.prisma as any).timeSlot.count({
        where: { fieldId, slotDate },
      });
      if (existingCount > 0) return;

      const [openH, openM] = (field.openTime || '08:00').split(':').map(Number);
      const [closeH, closeM] = (field.closeTime || '23:00').split(':').map(Number);

      const openMinutes = openH * 60 + (openM || 0);
      const closeMinutes = closeH * 60 + (closeM || 0);
      const duration = (field as any).slotDuration || 60;

      const slots: any[] = [];
      
      for (let m = openMinutes; m + duration <= closeMinutes; m += duration) {
        const startH = Math.floor(m / 60);
        const startM = m % 60;
        const endH = Math.floor((m + duration) / 60);
        const endM = (m + duration) % 60;

        const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
        const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        slots.push({
          fieldId,
          slotDate,
          startTime,
          endTime,
          isAvailable: true,
        });
      }

      if (slots.length > 0) {
        await (this.prisma as any).timeSlot.createMany({
          data: slots,
          skipDuplicates: true,
        });
      }
    } catch (error: any) {
      console.error('generateSlotsForField error:', error.message);
    }
  }

  async generateSlotsForDays(fieldId: string, days: number) {
    try {
      for (let i = 0; i < days; i++) {
        // O'zbekiston vaqti bilan sanani hisoblash va UTC midnight ga o'tkazish
        const dateStr = dayjs().tz(UZ_TIMEZONE).add(i, 'day').format('YYYY-MM-DD');
        const dateForDb = new Date(dateStr);
        await this.generateSlotsForField(fieldId, dateForDb);
      }
    } catch (error) {
      console.error('Error in generateSlotsForDays:', error);
      throw error;
    }
  }

  async markUnavailable(
    fieldId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ) {
    try {
      const field = await (this.prisma as any).field.findUnique({ where: { id: fieldId } });
      if (!field) return;

      // Sanani normalizatsiya qilish (UTC midnight)
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      const normalizedDate = new Date(dateStr);

      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);
      const duration = (field as any).slotDuration || 60;

      for (let m = startMinutes; m < endMinutes; m += duration) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const slotStart = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        
        await (this.prisma as any).timeSlot.updateMany({
          where: { fieldId, slotDate: normalizedDate, startTime: slotStart },
          data: { isAvailable: false },
        });
      }
    } catch (error: any) {
      console.error('Error in markUnavailable:', error);
      throw error;
    }
  }

  async markAvailable(
    fieldId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ) {
    try {
      const field = await (this.prisma as any).field.findUnique({ where: { id: fieldId } });
      if (!field) return;

      // Sanani normalizatsiya qilish (UTC midnight)
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      const normalizedDate = new Date(dateStr);

      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);
      const duration = (field as any).slotDuration || 60;

      for (let m = startMinutes; m < endMinutes; m += duration) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const slotStart = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        
        await (this.prisma as any).timeSlot.updateMany({
          where: { fieldId, slotDate: normalizedDate, startTime: slotStart },
          data: { isAvailable: true },
        });
      }
    } catch (error: any) {
      console.error('Error in markAvailable:', error);
      throw error;
    }
  }
}
