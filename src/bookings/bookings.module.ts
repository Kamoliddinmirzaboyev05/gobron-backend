import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { GatewayModule } from '../gateway/gateway.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SlotsModule } from '../slots/slots.module';

@Module({
  imports: [GatewayModule, NotificationsModule, SlotsModule],
  providers: [BookingsService],
  controllers: [BookingsController],
})
export class BookingsModule {}
