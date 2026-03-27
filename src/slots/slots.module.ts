import { Module } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { SlotsScheduler } from './slots.scheduler';
import { SlotsController } from './slots.controller';

@Module({
  providers: [SlotsService, SlotsScheduler],
  controllers: [SlotsController],
  exports: [SlotsService],
})
export class SlotsModule {}
