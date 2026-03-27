import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // User: o'z xabarnomalarni ko'rish
  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Foydalanuvchi o\'z xabarnomalarni ko\'rishi' })
  getMyNotifications(@CurrentUser('id') userId: string) {
    return this.notificationsService.getMyNotifications(userId);
  }

  // User: xabarnomani o'qilgan qilish
  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xabarnomani o\'qilgan qilish' })
  markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  // Admin: o'z maydon bookinglariga xabar yuborish
  @Post('admin/booking/:bookingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin, Role.superadmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin bookingga xabar yuborish' })
  @ApiBody({
    description: 'Admin tomonidan bookingga xabar yuborish',
    schema: {
      example: {
        message: "Assalomu alaykum, maydonimizga 10 daqiqa oldinroq kelishingizni so'raymiz."
      }
    }
  })
  sendBookingNotification(
    @Param('bookingId') bookingId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { message: string },
  ) {
    return this.notificationsService.sendBookingNotification(
      bookingId,
      userId,
      body.message,
    );
  }
}