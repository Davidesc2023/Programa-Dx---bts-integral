import { Module } from '@nestjs/common';
import { OrderTestsController } from './order-tests.controller';
import { OrderTestsService } from './order-tests.service';

@Module({
  controllers: [OrderTestsController],
  providers: [OrderTestsService],
})
export class OrderTestsModule {}
