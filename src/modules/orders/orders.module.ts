import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderTestsModule } from './order-tests/order-tests.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [OrderTestsModule, NotificationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
