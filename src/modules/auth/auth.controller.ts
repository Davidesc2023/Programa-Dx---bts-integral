import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ResponseDto } from '../../common/dto/response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Registrar nuevo usuario (solo ADMIN)' })
  async register(@Body() dto: RegisterDto) {
    const user = await this.authService.register(dto);
    return ResponseDto.of(user, 'Usuario registrado exitosamente', HttpStatus.CREATED);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener tokens JWT' })
  async login(@Body() dto: LoginDto) {
    const tokens = await this.authService.login(dto);
    return ResponseDto.of(tokens, 'Login exitoso', HttpStatus.OK);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token usando refresh token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const result = await this.authService.refresh(dto);
    return ResponseDto.of(result, 'Token renovado exitosamente', HttpStatus.OK);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar sesión e invalidar refresh token' })
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto);
    return ResponseDto.of(null, 'Sesión cerrada exitosamente', HttpStatus.OK);
  }
}
