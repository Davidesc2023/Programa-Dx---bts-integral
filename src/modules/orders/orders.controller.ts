import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ICurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { FindOrdersQueryDto } from './dto/find-orders-query.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('ADMIN', 'OPERADOR', 'MEDICO')
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const order = await this.ordersService.create(dto, currentUser.userId);
    return ResponseDto.of(order, 'Orden creada exitosamente', HttpStatus.CREATED);
  }

  @Get()
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  async findAll(@Query() query: FindOrdersQueryDto) {
    const { orders, total } = await this.ordersService.findAll(query);
    return PaginatedResponseDto.of(
      orders,
      total,
      query.page,
      query.limit,
      'Órdenes obtenidas exitosamente',
      HttpStatus.OK,
    );
  }

  @Get(':id')
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  async findOne(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    return ResponseDto.of(order, 'Orden obtenida exitosamente', HttpStatus.OK);
  }

  @Patch(':id')
  @Roles('ADMIN', 'OPERADOR', 'MEDICO')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const order = await this.ordersService.update(id, dto, currentUser.userId);
    return ResponseDto.of(order, 'Orden actualizada exitosamente', HttpStatus.OK);
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'OPERADOR', 'LABORATORIO', 'MEDICO')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const order = await this.ordersService.updateStatus(
      id,
      dto.status,
      currentUser.role as 'ADMIN' | 'OPERADOR' | 'LABORATORIO' | 'MEDICO',
      currentUser.userId,
    );
    return ResponseDto.of(order, 'Estado de orden actualizado exitosamente', HttpStatus.OK);
  }

  @Delete(':id')
  @Roles('ADMIN', 'OPERADOR')
  async remove(@Param('id') id: string, @CurrentUser() currentUser: ICurrentUser) {
    await this.ordersService.remove(id, currentUser.userId);
    return ResponseDto.of(null, 'Orden eliminada exitosamente', HttpStatus.OK);
  }
}
