import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, ICurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseDto } from '../../common/dto/response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsentsService } from './consents.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { RespondConsentDto } from './dto/respond-consent.dto';
import { SignConsentDto } from './dto/sign-consent.dto';

@ApiTags('Consents')
@ApiBearerAuth('access-token')
@Controller('orders/:orderId/consent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentsController {
  constructor(private readonly consentsService: ConsentsService) {}

  @Post()
  @Roles('ADMIN', 'OPERADOR', 'MEDICO')
  @ApiOperation({ summary: 'Crear consentimiento para una orden' })
  @ApiParam({ name: 'orderId', description: 'ID de la orden' })
  async create(
    @Param('orderId') orderId: string,
    @Body() dto: CreateConsentDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const consent = await this.consentsService.create(orderId, dto, currentUser.userId);
    return ResponseDto.of(consent, 'Consentimiento creado exitosamente', HttpStatus.CREATED);
  }

  @Get()
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  @ApiOperation({ summary: 'Obtener consentimiento de una orden' })
  @ApiParam({ name: 'orderId', description: 'ID de la orden' })
  async findOne(@Param('orderId') orderId: string) {
    const consent = await this.consentsService.findByOrder(orderId);
    return ResponseDto.of(consent, 'Consentimiento obtenido exitosamente', HttpStatus.OK);
  }

  @Patch('sign')
  @Roles('ADMIN', 'MEDICO')
  @ApiOperation({ summary: 'Médico firma el consentimiento' })
  @ApiParam({ name: 'orderId', description: 'ID de la orden' })
  async sign(
    @Param('orderId') orderId: string,
    @Body() dto: SignConsentDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const consent = await this.consentsService.sign(orderId, dto, currentUser.userId);
    return ResponseDto.of(consent, 'Consentimiento firmado exitosamente', HttpStatus.OK);
  }

  @Patch('send')
  @Roles('ADMIN', 'OPERADOR', 'MEDICO')
  @ApiOperation({ summary: 'Enviar consentimiento al paciente' })
  @ApiParam({ name: 'orderId', description: 'ID de la orden' })
  async send(
    @Param('orderId') orderId: string,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const consent = await this.consentsService.send(orderId, currentUser.userId);
    return ResponseDto.of(consent, 'Consentimiento enviado al paciente', HttpStatus.OK);
  }

  @Patch('respond')
  @Roles('ADMIN', 'OPERADOR')
  @ApiOperation({ summary: 'Registrar respuesta del paciente (operador)' })
  @ApiParam({ name: 'orderId', description: 'ID de la orden' })
  async respond(
    @Param('orderId') orderId: string,
    @Body() dto: RespondConsentDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const consent = await this.consentsService.respond(orderId, dto, currentUser.userId);
    return ResponseDto.of(
      consent,
      `Consentimiento ${dto.response.toLowerCase()} por el paciente`,
      HttpStatus.OK,
    );
  }
}
