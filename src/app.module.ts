import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FieldsModule } from './fields/fields.module';
import { GatewayModule } from './gateway/gateway.module';
import { SlotsModule } from './slots/slots.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    FieldsModule,
    GatewayModule,
    SlotsModule,
    NotificationsModule,
    BookingsModule,
    ReviewsModule,
    FavoritesModule,
  ],
})
export class AppModule {}
