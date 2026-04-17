import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ICurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePatientDto } from './dto/create-patient.dto';
import { FindPatientsQueryDto } from './dto/find-patients-query.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@ApiTags('Patients')
@ApiBearerAuth('access-token')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles('ADMIN', 'OPERADOR')
  async create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const patient = await this.patientsService.create(dto, currentUser.userId);
    return ResponseDto.of(patient, 'Paciente registrado exitosamente', HttpStatus.CREATED);
  }

  @Get()
  @Roles('ADMIN', 'OPERADOR', 'MEDICO')
  async findAll(@Query() query: FindPatientsQueryDto) {
    const { patients, total } = await this.patientsService.findAll(query);
    return PaginatedResponseDto.of(
      patients,
      total,
      query.page,
      query.limit,
      'Pacientes obtenidos exitosamente',
      HttpStatus.OK,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const patient = await this.patientsService.findOne(id);
    return ResponseDto.of(patient, 'Paciente obtenido exitosamente', HttpStatus.OK);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERADOR')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const patient = await this.patientsService.update(id, dto, currentUser.userId);
    return ResponseDto.of(patient, 'Paciente actualizado exitosamente', HttpStatus.OK);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OPERADOR')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: ICurrentUser) {
    await this.patientsService.remove(id, currentUser.userId);
    return ResponseDto.of(null, 'Paciente eliminado exitosamente', HttpStatus.OK);
  }
}
