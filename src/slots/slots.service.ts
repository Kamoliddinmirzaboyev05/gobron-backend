import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  async getSlots(fieldId: string, date: string) {
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      return this.prisma.timeSlot.findMany({
        where: { fieldId, slotDate: parsedDate },
        orderBy: { startTime: 'asc' },
      });
    } catch (error) {
      console.error('Error in getSlots:', error);
      throw error;
    }
  }

  async generateSlotsForField(fieldId: string, date: Date) {
    try {
      const field = await this.prisma.field.findUnique({
        where: { id: fieldId },
      });
      if (!field) return;

      const [openH, openM] = field.openTime.split(':').map(Number);
      const [closeH, closeM] = field.closeTime.split(':').map(Number);

      const openMinutes = openH * 60 + (openM || 0);
      const closeMinutes = closeH * 60 + (closeM || 0);
      const duration = (field as any).slotDuration || 60;

      const slots: Prisma.TimeSlotCreateManyInput[] = [];
      for (let m = openMinutes; m + duration <= closeMinutes; m += duration) {
        const startH = Math.floor(m / 60);
        const startM = m % 60;
        const endH = Math.floor((m + duration) / 60);
        const endM = (m + duration) % 60;

        slots.push({
          fieldId,
          slotDate: date,
          startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
          endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
          isAvailable: true,
        });
      }

      await this.prisma.timeSlot.createMany({
        data: slots,
        skipDuplicates: true,
      });
    } catch (error) {
      console.error('Error in generateSlotsForField:', error);
      throw error;
    }
  }

  async generateSlotsForDays(fieldId: string, days: number) {
    try {
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);
        await this.generateSlotsForField(fieldId, date);
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
      const field = await this.prisma.field.findUnique({ where: { id: fieldId } });
      if (!field) return;

      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);
      const duration = (field as any).slotDuration || 60;

      for (let m = startMinutes; m < endMinutes; m += duration) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const slotStart = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        
        await this.prisma.timeSlot.updateMany({
          where: { fieldId, slotDate: date, startTime: slotStart },
          data: { isAvailable: false },
        });
      }
    } catch (error) {
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
      const field = await this.prisma.field.findUnique({ where: { id: fieldId } });
      if (!field) return;

      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      
      const startMinutes = startH * 60 + (startM || 0);
      const endMinutes = endH * 60 + (endM || 0);
      const duration = (field as any).slotDuration || 60;

      for (let m = startMinutes; m < endMinutes; m += duration) {
        const h = Math.floor(m / 60);
        const min = m % 60;
        const slotStart = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        
        await this.prisma.timeSlot.updateMany({
          where: { fieldId, slotDate: date, startTime: slotStart },
          data: { isAvailable: true },
        });
      }
    } catch (error) {
      console.error('Error in markAvailable:', error);
      throw error;
    }
  }
}
