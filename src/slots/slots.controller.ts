import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Slots')
@Controller('slots')
export class SlotsController {
  constructor(private slotsService: SlotsService) {}

  // Public: maydon slotlari
  @Get('field/:fieldId/date/:date')
  @ApiOperation({ summary: 'Maydonning bo\'sh vaqtlarini olish' })
  getSlots(@Param('fieldId') fieldId: string, @Param('date') date: string) {
    return this.slotsService.getSlots(fieldId, date);
  }

  // Admin: slotlarni yaratish (kunlik)
  @Post('admin/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin maydon uchun slotlarni yaratish (kunlik)' })
  @ApiBody({
    description: 'Bir kunlik slotlarni yaratish',
    schema: {
      example: {
        date: "2026-04-15"
      }
    }
  })
  generateSlotsForField(
    @CurrentUser('id') userId: string,
    @Body() body: { date: string },
  ) {
    return this.slotsService.generateSlotsForField(userId, new Date(body.date));
  }

  // Admin: slotlarni yaratish (ko'p kunlik)
  @Post('admin/generate/batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin maydon uchun slotlarni yaratish (ko\'p kunlik)' })
  @ApiBody({
    description: 'Ko\'p kunlik slotlarni yaratish (masalan keyingi 30 kun uchun)',
    schema: {
      example: {
        days: 30
      }
    }
  })
  generateSlotsForDays(
    @CurrentUser('id') userId: string,
    @Body() body: { days: number },
  ) {
    return this.slotsService.generateSlotsForDays(userId, body.days);
  }

  // Admin: slotni band qilish
  @Post('admin/:fieldId/unavailable')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin slotni band qilish' })
  @ApiBody({
    description: 'Slotni band qilish',
    schema: {
      example: {
        date: "2026-04-15",
        startTime: "18:00",
        endTime: "19:00"
      }
    }
  })
  markUnavailable(
    @Param('fieldId') fieldId: string,
    @Body() body: { date: string; startTime: string; endTime: string },
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
  @ApiBody({
    description: 'Slotni bo\'shatish',
    schema: {
      example: {
        date: "2026-04-15",
        startTime: "18:00",
        endTime: "19:00"
      }
    }
  })
  markAvailable(
    @Param('fieldId') fieldId: string,
    @Body() body: { date: string; startTime: string; endTime: string },
  ) {
    return this.slotsService.markAvailable(
      fieldId,
      new Date(body.date),
      body.startTime,
      body.endTime,
    );
  }
}