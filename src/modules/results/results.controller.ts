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
import { CreateResultDto } from './dto/create-result.dto';
import { FindResultsQueryDto } from './dto/find-results-query.dto';
import { UpdateResultDto } from './dto/update-result.dto';
import { ResultsService } from './results.service';

@ApiTags('Results')
@ApiBearerAuth('access-token')
@Controller('results')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Post()
  @Roles('ADMIN', 'LABORATORIO', 'MEDICO')
  async create(
    @Body() dto: CreateResultDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    const result = await this.resultsService.create(dto, user.userId);
    return ResponseDto.of(result, 'Resultado creado exitosamente', HttpStatus.CREATED);
  }

  @Get()
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  async findAll(@Query() query: FindResultsQueryDto) {
    const { results, total } = await this.resultsService.findAll(query);
    return PaginatedResponseDto.of(results, total, query.page, query.limit, 'Resultados obtenidos', HttpStatus.OK);
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.resultsService.findOne(id);
    return ResponseDto.of(result, 'Resultado obtenido', HttpStatus.OK);
  }

  @Patch(':id')
  @Roles('ADMIN', 'LABORATORIO', 'MEDICO')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateResultDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    const result = await this.resultsService.update(id, dto, user.userId);
    return ResponseDto.of(result, 'Resultado actualizado exitosamente', HttpStatus.OK);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'LABORATORIO')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    await this.resultsService.remove(id, user.userId);
  }
}
