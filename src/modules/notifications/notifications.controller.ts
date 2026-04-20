import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, ICurrentUser } from '../../common/decorators/current-user.decorator';
import { ResponseDto } from '../../common/dto/response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (paginated, newest first)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser() user: ICurrentUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.notifications.findAll(
      user.userId,
      page ? parseInt(page, 10) : 1,
      limit ? Math.min(parseInt(limit, 10), 50) : 20,
    );
    return ResponseDto.of(result, 'Notificaciones obtenidas');
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@CurrentUser() user: ICurrentUser) {
    const result = await this.notifications.getUnreadCount(user.userId);
    return ResponseDto.of(result, 'Conteo de no leídas');
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async markRead(@CurrentUser() user: ICurrentUser, @Param('id') id: string) {
    const result = await this.notifications.markRead(id, user.userId);
    return ResponseDto.of(result, 'Notificación marcada como leída');
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark ALL my notifications as read' })
  async markAllRead(@CurrentUser() user: ICurrentUser) {
    const result = await this.notifications.markAllRead(user.userId);
    return ResponseDto.of(result, 'Todas las notificaciones marcadas como leídas');
  }
}
