import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { BookingsGateway } from './bookings.gateway';

@Module({
  providers: [AppGateway, BookingsGateway],
  exports: [AppGateway, BookingsGateway],
})
export class GatewayModule {}
