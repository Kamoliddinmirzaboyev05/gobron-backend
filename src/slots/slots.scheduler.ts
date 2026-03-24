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

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    for (const field of fields) {
      await this.slotsService.generateSlotsForField(field.id, tomorrow);
    }

    console.log(`${fields.length} ta maydon uchun ertangi slotlar yaratildi`);
  }
}
