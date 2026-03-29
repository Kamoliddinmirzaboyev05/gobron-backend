import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BookingStatus, Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  // User yoki Admin: booking yaratish
  @Post()
  @Roles(Role.user, Role.admin, Role.superadmin)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Yangi booking yaratish (Foydalanuvchi yoki Admin)' })
  @ApiBody({
    description: 'Booking yaratish ma\'lumotlari',
    schema: {
      example: {
        fieldId: "uuid-field-id",
        bookingDate: "2026-03-29",
        startTime: "18:00",
        endTime: "19:00",
        totalPrice: 150000,
        note: "Admin orqali band qilindi",
        clientName: "Ali Valiyev",
        clientPhone: "+998901234567"
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Booking muvaffaqiyatli yaratildi' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(userId, dto);
  }

  // User: kelgusi bookinglari
  @Get('my/upcoming')
  @ApiOperation({ summary: 'Foydalanuvchining kelgusi (bo\'ladigan) bookinglarini olish' })
  @ApiResponse({ status: 200, description: 'Kelgusi bookinglar ro\'yxati' })
  getUpcoming(@CurrentUser('id') userId: string) {
    return this.bookingsService.getUpcoming(userId);
  }

  // User: o'tgan bookinglari (history)
  @Get('my/history')
  @ApiOperation({ summary: 'Foydalanuvchining o\'tgan (tarixdagi) bookinglarini olish' })
  @ApiResponse({ status: 200, description: 'Bookinglar tarixi ro\'yxati' })
  getHistory(@CurrentUser('id') userId: string) {
    return this.bookingsService.getHistory(userId);
  }

  // User: faol bookinglari (bugun)
  @Get('my/active')
  @ApiOperation({ summary: 'Foydalanuvchining bugungi faol (tasdiqlangan) bookinglarini olish' })
  @ApiResponse({ status: 200, description: 'Bugungi faol bookinglar ro\'yxati' })
  getActive(@CurrentUser('id') userId: string) {
    return this.bookingsService.getActive(userId);
  }

  // User: barcha bookinglari
  @Get('my')
  @ApiOperation({ summary: 'Foydalanuvchining barcha bookinglarini olish' })
  getMyBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.getUpcoming(userId); // Default upcoming
  }

  // User: bekor qilish
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Foydalanuvchi bookingni bekor qilishi' })
  @ApiResponse({ status: 200, description: 'Booking bekor qilindi' })
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bookingsService.cancel(id, userId);
  }

  // Admin: o'z maydon bookinglarini ko'rish
  @ApiTags('Admin - Bookings')
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiOperation({ summary: 'Admin o\'z maydon bookinglarini ko\'rishi' })
  @ApiResponse({ status: 200, description: 'Bookinglar ro\'yxati' })
  getAdminBookings(
    @CurrentUser('id') userId: string,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingsService.getAdminBookings(userId, status);
  }

  // Admin: tasdiqlash / rad etish
  @ApiTags('Admin - Bookings')
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiOperation({ summary: 'Admin: tasdiqlash / rad etish' })
  @ApiResponse({ status: 200, description: 'Booking holati yangilandi' })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, userId, dto);
  }

  // Superadmin: barcha bookinglar
  @ApiTags('Admin - Bookings')
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin)
  @ApiOperation({ summary: 'Superadmin barcha bookinglarni ko\'rishi' })
  @ApiResponse({ status: 200, description: 'Barcha bookinglar ro\'yxati' })
  getAllBookings(@Query('status') status?: BookingStatus) {
    return this.bookingsService.getAllBookings(status);
  }
}
