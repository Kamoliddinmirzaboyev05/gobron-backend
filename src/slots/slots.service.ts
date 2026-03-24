import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  async getSlots(fieldId: string, date: string) {
    return this.prisma.timeSlot.findMany({
      where: { fieldId, slotDate: new Date(date) },
      orderBy: { startTime: 'asc' },
    });
  }

  async generateSlotsForField(fieldId: string, date: Date) {
    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
    });
    if (!field) return;

    const openHour = parseInt(field.openTime.split(':')[0]);
    const closeHour = parseInt(field.closeTime.split(':')[0]);

    const slots: Prisma.TimeSlotCreateManyInput[] = [];
    for (let h = openHour; h < closeHour; h++) {
      slots.push({
        fieldId,
        slotDate: date,
        startTime: `${String(h).padStart(2, '0')}:00`,
        endTime: `${String(h + 1).padStart(2, '0')}:00`,
        isAvailable: true,
      });
    }

    await this.prisma.timeSlot.createMany({
      data: slots,
      skipDuplicates: true,
    });
  }

  async generateSlotsForDays(fieldId: string, days: number) {
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      date.setHours(0, 0, 0, 0);
      await this.generateSlotsForField(fieldId, date);
    }
  }

  async markUnavailable(
    fieldId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ) {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);

    for (let h = startHour; h < endHour; h++) {
      const slotStart = `${String(h).padStart(2, '0')}:00`;
      await this.prisma.timeSlot.updateMany({
        where: { fieldId, slotDate: date, startTime: slotStart },
        data: { isAvailable: false },
      });
    }
  }

  async markAvailable(
    fieldId: string,
    date: Date,
    startTime: string,
    endTime: string,
  ) {
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);

    for (let h = startHour; h < endHour; h++) {
      const slotStart = `${String(h).padStart(2, '0')}:00`;
      await this.prisma.timeSlot.updateMany({
        where: { fieldId, slotDate: date, startTime: slotStart },
        data: { isAvailable: true },
      });
    }
  }
}
