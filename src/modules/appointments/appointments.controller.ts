import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, ICurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { FindAppointmentsQueryDto, UpdateAppointmentStatusDto } from './dto/find-appointments-query.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@ApiTags('Appointments')
@ApiBearerAuth('access-token')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('ADMIN', 'OPERADOR')
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    const appointment = await this.appointmentsService.create(dto, user.userId);
    return ResponseDto.of(appointment, 'Cita creada exitosamente', HttpStatus.CREATED);
  }

  @Get()
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  async findAll(@Query() query: FindAppointmentsQueryDto) {
    const { appointments, total } = await this.appointmentsService.findAll(query);
    return PaginatedResponseDto.of(appointments, total, query.page, query.limit, 'Citas obtenidas', HttpStatus.OK);
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const appointment = await this.appointmentsService.findOne(id);
    return ResponseDto.of(appointment, 'Cita obtenida', HttpStatus.OK);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERADOR')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    const appointment = await this.appointmentsService.update(id, dto, user.userId);
    return ResponseDto.of(appointment, 'Cita actualizada exitosamente', HttpStatus.OK);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'OPERADOR')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    const appointment = await this.appointmentsService.updateStatus(id, dto, user.userId);
    return ResponseDto.of(appointment, 'Estado de cita actualizado', HttpStatus.OK);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'OPERADOR')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    await this.appointmentsService.remove(id, user.userId);
  }
}
