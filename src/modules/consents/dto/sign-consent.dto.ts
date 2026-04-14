import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SignConsentDto {
  @ApiPropertyOptional({ example: 'Firmado por el Dr. García' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
