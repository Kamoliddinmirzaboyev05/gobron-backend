import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFieldDto } from './dto/update-field.dto';

@Injectable()
export class FieldsService {
  constructor(private prisma: PrismaService) {}

  // Barcha aktiv maydonlar — foydalanuvchilar uchun
  async findAll(city?: string) {
    const where: any = { isActive: true };
    if (city) {
      where.city = city;
    }
    return this.prisma.field.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Bitta maydon — public
  async findOne(id: string) {
    const field = await this.prisma.field.findUnique({
      where: { id },
    });
    if (!field) throw new NotFoundException('Maydon topilmadi');
    return field;
  }

  // Admin o'z maydonini ko'radi
  async findMyField(userId: string) {
    const field = await this.prisma.field.findFirst({
      where: { userId },
    });
    if (!field) throw new NotFoundException('Maydon topilmadi');
    return field;
  }

  // Admin o'z maydonini yangilaydi
  async update(userId: string, dto: UpdateFieldDto) {
    const field = await this.prisma.field.findFirst({
      where: { userId },
    });
    if (!field) throw new NotFoundException('Maydon topilmadi');

    return this.prisma.field.update({
      where: { id: field.id },
      data: dto,
    });
  }

  // Superadmin — barcha maydonlar (aktiv + nofaol)
  async findAllAdmin() {
    return this.prisma.field.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Maydon slotlari
  async getSlots(fieldId: string, date: string) {
    return this.prisma.timeSlot.findMany({
      where: {
        fieldId,
        slotDate: new Date(date),
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
