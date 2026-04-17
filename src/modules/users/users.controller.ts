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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, ICurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { ResponseDto } from '../../common/dto/response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser() currentUser: ICurrentUser) {
    const user = await this.usersService.create(dto, currentUser.userId);
    return ResponseDto.of(user, 'Usuario creado exitosamente', HttpStatus.CREATED);
  }

  @Get()
  async findAll(@Query() query: FindUsersQueryDto) {
    const { users, total } = await this.usersService.findAll(query);
    return PaginatedResponseDto.of(
      users,
      total,
      query.page,
      query.limit,
      'Usuarios obtenidos exitosamente',
      HttpStatus.OK,
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.usersService.findOne(id);
    return ResponseDto.of(user, 'Usuario obtenido exitosamente', HttpStatus.OK);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: ICurrentUser,
  ) {
    const user = await this.usersService.update(id, dto, currentUser.userId);
    return ResponseDto.of(user, 'Usuario actualizado exitosamente', HttpStatus.OK);
  }

  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() currentUser: ICurrentUser) {
    await this.usersService.remove(id, currentUser.userId);
    return ResponseDto.of(null, 'Usuario eliminado exitosamente', HttpStatus.OK);
  }
}
