import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { GenerateSlotsDto } from './dto/generate-slots.dto';
import { GenerateSlotsBatchDto } from './dto/generate-slots-batch.dto';
import { MarkSlotDto } from './dto/mark-slot.dto';
import { SlotResponseDto } from './dto/slot-response.dto';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Slots')
@Controller('slots')
export class SlotsController {
  constructor(
    private slotsService: SlotsService,
    private prisma: PrismaService,
  ) {}

  // Public: maydon slotlari
  @Get('field/:fieldId/date/:date')
  @ApiOperation({ summary: 'Maydonning bo\'sh vaqtlarini olish' })
  @ApiResponse({ status: 200, type: [SlotResponseDto], description: 'Sana bo\'yicha slotlar ro\'yxati' })
  getSlots(@Param('fieldId') fieldId: string, @Param('date') date: string) {
    return this.slotsService.getSlots(fieldId, date);
  }

  // Admin: slotlarni yaratish (kunlik)
  @Post('admin/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin maydon uchun slotlarni yaratish (kunlik)' })
  @ApiResponse({ status: 201, description: 'Slotlar muvaffaqiyatli yaratildi' })
  async generateSlotsForField(
    @CurrentUser('id') userId: string,
    @Body() body: GenerateSlotsDto,
  ) {
    const field = await this.prisma.field.findFirst({ where: { userId } });
    if (!field) throw new NotFoundException('Maydon topilmadi');
    
    return this.slotsService.generateSlotsForField(field.id, new Date(body.date));
  }

  // Admin: slotlarni yaratish (ko'p kunlik)
  @Post('admin/generate/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin maydon uchun slotlarni yaratish (ko\'p kunlik)' })
  @ApiResponse({ status: 201, description: 'Ko\'p kunlik slotlar muvaffaqiyatli yaratildi' })
  async generateSlotsForDays(
    @CurrentUser('id') userId: string,
    @Body() body: GenerateSlotsBatchDto,
  ) {
    const field = await this.prisma.field.findFirst({ where: { userId } });
    if (!field) throw new NotFoundException('Maydon topilmadi');

    return this.slotsService.generateSlotsForDays(field.id, body.days);
  }

  // Admin: slotni band qilish
  @Post('admin/:fieldId/unavailable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin slotni band qilish' })
  @ApiResponse({ status: 201, description: 'Slot muvaffaqiyatli band qilindi' })
  markUnavailable(
    @Param('fieldId') fieldId: string,
    @Body() body: MarkSlotDto,
  ) {
    return this.slotsService.markUnavailable(
      fieldId,
      new Date(body.date),
      body.startTime,
      body.endTime,
    );
  }

  // Admin: slotni bo'shatish
  @Post('admin/:fieldId/available')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin slotni bo\'shatish' })
  @ApiResponse({ status: 201, description: 'Slot muvaffaqiyatli bo\'shatildi' })
  markAvailable(
    @Param('fieldId') fieldId: string,
    @Body() body: MarkSlotDto,
  ) {
    return this.slotsService.markAvailable(
      fieldId,
      new Date(body.date),
      body.startTime,
      body.endTime,
    );
  }
}
