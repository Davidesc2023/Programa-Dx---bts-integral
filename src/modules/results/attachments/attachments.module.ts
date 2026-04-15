import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { StorageService } from '../../../common/storage/storage.service';

@Module({
  controllers: [AttachmentsController],
  providers: [AttachmentsService, StorageService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
