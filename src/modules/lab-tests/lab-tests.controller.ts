import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateLabTestDto, LabTestsService } from './lab-tests.service';

@ApiTags('lab-tests')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('lab-tests')
export class LabTestsController {
  constructor(private readonly service: LabTestsService) {}

  /** Catálogo activo — accesible para todos los roles autenticados */
  @Get()
  findAll(@Query('all') all?: string) {
    return this.service.findAll(all !== 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** Verificar prerrequisito antes de agregar un examen a una orden */
  @Get(':id/prerequisite/:patientId')
  checkPrerequisite(
    @Param('id') labTestId: string,
    @Param('patientId') patientId: string,
  ) {
    return this.service.checkPrerequisite(labTestId, patientId);
  }

  /** Solo ADMIN puede crear/modificar el catálogo */
  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateLabTestDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: Partial<CreateLabTestDto>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
