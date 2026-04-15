import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PatientsModule } from './modules/patients/patients.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ResultsModule } from './modules/results/results.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { ConsentsModule } from './modules/consents/consents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PatientPortalModule } from './modules/patient-portal/patient-portal.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    OrdersModule,
    ResultsModule,
    AppointmentsModule,
    ConsentsModule,
    NotificationsModule,
    PatientPortalModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
