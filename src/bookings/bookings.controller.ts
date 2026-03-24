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

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  // User: booking yaratish
  @Post()
  @Roles(Role.user)
  @UseGuards(RolesGuard)
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(userId, dto);
  }

  // User: o'z bookinglarini ko'rish
  @Get('my')
  getMyBookings(@CurrentUser('id') userId: string) {
    return this.bookingsService.getMyBookings(userId);
  }

  // User: bekor qilish
  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.bookingsService.cancel(id, userId);
  }

  // Admin: o'z maydon bookinglarini ko'rish
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  getAdminBookings(
    @CurrentUser('id') userId: string,
    @Query('status') status?: BookingStatus,
  ) {
    return this.bookingsService.getAdminBookings(userId, status);
  }

  // Admin: tasdiqlash / rad etish
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, userId, dto);
  }

  // Superadmin: barcha bookinglar
  @Get('all')
  @UseGuards(RolesGuard)
  @Roles(Role.superadmin)
  getAllBookings(@Query('status') status?: BookingStatus) {
    return this.bookingsService.getAllBookings(status);
  }
}
