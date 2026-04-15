import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { ConsentsModule } from '../consents/consents.module';
import { PatientPortalController } from './patient-portal.controller';
import { PatientPortalService } from './patient-portal.service';

@Module({
  imports: [PrismaModule, ConsentsModule],
  controllers: [PatientPortalController],
  providers: [PatientPortalService],
})
export class PatientPortalModule {}
