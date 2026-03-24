import { Module } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { SlotsScheduler } from './slots.scheduler';

@Module({
  providers: [SlotsService, SlotsScheduler],
  exports: [SlotsService],
})
export class SlotsModule {}
