import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateConsentDto {
  @ApiPropertyOptional({ example: 'Consentimiento para panel hematológico completo' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
