import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser, ICurrentUser } from '../../../common/decorators/current-user.decorator';
import { OrderTestsService } from './order-tests.service';
import { CreateOrderTestDto } from './dto/create-order-test.dto';

@ApiTags('Order Tests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders/:orderId/tests')
export class OrderTestsController {
  constructor(private readonly orderTestsService: OrderTestsService) {}

  @Post()
  @Roles('OPERADOR', 'LABORATORIO', 'ADMIN')
  @ApiOperation({ summary: 'Agregar examen a una orden' })
  @ApiParam({ name: 'orderId', type: String })
  @ApiResponse({ status: 201, description: 'Examen agregado' })
  create(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: CreateOrderTestDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    return this.orderTestsService.create(orderId, dto, currentUser.userId);
  }

  @Get()
  @Roles('OPERADOR', 'LABORATORIO', 'MEDICO', 'ADMIN')
  @ApiOperation({ summary: 'Listar ex\u00e1menes de una orden' })
  @ApiParam({ name: 'orderId', type: String })
  @ApiResponse({ status: 200, description: 'Lista de ex\u00e1menes' })
  findAll(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.orderTestsService.findByOrder(orderId);
  }

  @Delete(':testId')
  @Roles('OPERADOR', 'LABORATORIO', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar examen de una orden' })
  @ApiParam({ name: 'orderId', type: String })
  @ApiParam({ name: 'testId', type: String })
  @ApiResponse({ status: 200, description: 'Examen eliminado' })
  remove(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('testId', ParseUUIDPipe) testId: string,
  ) {
    return this.orderTestsService.remove(orderId, testId);
  }
}
