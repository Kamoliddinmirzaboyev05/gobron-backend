import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SlotsService } from './slots.service';

@Injectable()
export class SlotsScheduler {
  constructor(
    private prisma: PrismaService,
    private slotsService: SlotsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async generateDailySlots() {
    const fields = await this.prisma.field.findMany({
      where: { isActive: true },
    });

    for (const field of fields) {
      // Har kuni keyingi 3 kunlik slotlarni tayyorlab qo'yish
      await this.slotsService.generateSlotsForDays(field.id, 3);
    }

    console.log(`${fields.length} ta maydon uchun 3 kunlik slotlar yaratildi`);
  }
}
