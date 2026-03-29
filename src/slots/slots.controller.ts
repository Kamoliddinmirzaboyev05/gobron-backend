import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { SlotsService } from './slots.service';
import { FieldsSlotsResponseDto } from './dto/slot-response.dto';
import { BookSlotDto } from './dto/book-slot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Slots')
@Controller('slots')
export class SlotsController {
  constructor(
    private slotsService: SlotsService,
  ) {}

  // Public: maydon slotlari (3 kunlik yoki tanlangan sana)
  @Get('field/:fieldId')
  @ApiOperation({ summary: 'Maydonning bo\'sh vaqtlarini olish (3 kunlik yoki tanlangan sana)' })
  @ApiResponse({ status: 200, type: FieldsSlotsResponseDto, description: 'Guruhlangan slotlar ro\'yxati (avtomatik generatsiya qilinadi)' })
  getSlots(@Param('fieldId') fieldId: string, @Query('date') date?: string) {
    return this.slotsService.getSlots(fieldId, date);
  }

  // User: slotni band qilish
  @Post('book')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Slotni band qilish (Booking)' })
  @ApiBody({ type: BookSlotDto })
  @ApiResponse({ status: 201, description: 'Slot muvaffaqiyatli band qilindi' })
  @ApiResponse({ status: 400, description: 'Slot allaqachon band qilingan yoki xatolik' })
  @ApiResponse({ status: 404, description: 'Slot topilmadi' })
  bookSlot(@CurrentUser('id') userId: string, @Body() dto: BookSlotDto) {
    return this.slotsService.bookSlot(userId, dto);
  }
}
