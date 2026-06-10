import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { LabTestsController } from './lab-tests.controller';
import { LabTestsService } from './lab-tests.service';

@Module({
  imports: [PrismaModule],
  controllers: [LabTestsController],
  providers: [LabTestsService],
  exports: [LabTestsService],
})
export class LabTestsModule {}
