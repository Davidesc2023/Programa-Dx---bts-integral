import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
  filename: string;
}
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser, ICurrentUser } from '../../../common/decorators/current-user.decorator';
import { ResponseDto } from '../../../common/dto/response.dto';
import { AttachmentsService } from './attachments.service';

@ApiTags('Result Attachments')
@ApiBearerAuth('access-token')
@Controller('results/:resultId/attachments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'LABORATORIO', 'MEDICO')
  @ApiOperation({ summary: 'Subir archivo adjunto a un resultado' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async upload(
    @Param('resultId', ParseUUIDPipe) resultId: string,
    @UploadedFile() file: MulterFile,
    @CurrentUser() user: ICurrentUser,
  ) {
    const attachment = await this.attachmentsService.upload(resultId, file, user.userId);
    return ResponseDto.of(attachment, 'Archivo adjuntado correctamente', HttpStatus.CREATED);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  @ApiOperation({ summary: 'Listar adjuntos de un resultado' })
  async findAll(@Param('resultId', ParseUUIDPipe) resultId: string) {
    const attachments = await this.attachmentsService.findByResult(resultId);
    return ResponseDto.of(attachments, 'Adjuntos obtenidos correctamente', HttpStatus.OK);
  }

  @Get(':attachmentId/download')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  @ApiOperation({ summary: 'Descargar un archivo adjunto' })
  async download(
    @Param('resultId', ParseUUIDPipe) resultId: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Res({ passthrough: true }) _res: Response,
  ): Promise<StreamableFile> {
    return this.attachmentsService.download(resultId, attachmentId);
  }

  @Delete(':attachmentId')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'LABORATORIO', 'MEDICO')
  @ApiOperation({ summary: 'Eliminar un archivo adjunto' })
  async remove(
    @Param('resultId', ParseUUIDPipe) resultId: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    const result = await this.attachmentsService.remove(resultId, attachmentId, user.userId);
    return ResponseDto.of(result, 'Adjunto eliminado correctamente', HttpStatus.OK);
  }
}
