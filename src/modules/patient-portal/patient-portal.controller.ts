import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ICurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseDto } from '../../common/dto/response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RespondConsentPortalDto } from './dto/respond-consent-portal.dto';
import { PatientPortalService } from './patient-portal.service';

@ApiTags('Patient Portal')
@ApiBearerAuth('access-token')
@Controller('portal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('PACIENTE')
export class PatientPortalController {
  constructor(private readonly portalService: PatientPortalService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del paciente autenticado' })
  async getMe(@CurrentUser() user: ICurrentUser) {
    const data = await this.portalService.getMe(user.userId);
    return ResponseDto.of(data, 'Perfil obtenido', HttpStatus.OK);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Resumen del portal del paciente' })
  async getDashboard(@CurrentUser() user: ICurrentUser) {
    const data = await this.portalService.getDashboard(user.userId);
    return ResponseDto.of(data, 'Dashboard obtenido', HttpStatus.OK);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Listar órdenes del paciente autenticado' })
  async getOrders(@CurrentUser() user: ICurrentUser) {
    const data = await this.portalService.getOrders(user.userId);
    return ResponseDto.of(data, 'Órdenes obtenidas', HttpStatus.OK);
  }

  @Get('orders/:orderId')
  @ApiOperation({ summary: 'Detalle de una orden del paciente' })
  async getOrderById(
    @CurrentUser() user: ICurrentUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    const data = await this.portalService.getOrderById(user.userId, orderId);
    return ResponseDto.of(data, 'Orden obtenida', HttpStatus.OK);
  }

  @Get('orders/:orderId/consent')
  @ApiOperation({ summary: 'Ver consentimiento de una orden del paciente' })
  async getConsentForOrder(
    @CurrentUser() user: ICurrentUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ) {
    const data = await this.portalService.getConsentForOrder(user.userId, orderId);
    return ResponseDto.of(data, 'Consentimiento obtenido', HttpStatus.OK);
  }

  @Post('consents/:consentId/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aceptar consentimiento informado' })
  async acceptConsent(
    @CurrentUser() user: ICurrentUser,
    @Param('consentId', ParseUUIDPipe) consentId: string,
    @Body() dto: RespondConsentPortalDto,
  ) {
    const data = await this.portalService.respondConsent(user.userId, consentId, true, dto);
    return ResponseDto.of(data, 'Consentimiento aceptado', HttpStatus.OK);
  }

  @Post('consents/:consentId/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rechazar consentimiento informado' })
  async rejectConsent(
    @CurrentUser() user: ICurrentUser,
    @Param('consentId', ParseUUIDPipe) consentId: string,
    @Body() dto: RespondConsentPortalDto,
  ) {
    const data = await this.portalService.respondConsent(user.userId, consentId, false, dto);
    return ResponseDto.of(data, 'Consentimiento rechazado', HttpStatus.OK);
  }

  @Get('results')
  @ApiOperation({ summary: 'Ver resultados de exámenes del paciente' })
  async getResults(@CurrentUser() user: ICurrentUser) {
    const data = await this.portalService.getResults(user.userId);
    return ResponseDto.of(data, 'Resultados obtenidos', HttpStatus.OK);
  }

  @Get('appointments')
  @ApiOperation({ summary: 'Ver citas agendadas del paciente' })
  async getAppointments(@CurrentUser() user: ICurrentUser) {
    const data = await this.portalService.getAppointments(user.userId);
    return ResponseDto.of(data, 'Citas obtenidas', HttpStatus.OK);
  }
}
