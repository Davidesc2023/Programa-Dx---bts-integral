import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SignConsentDto {
  @ApiPropertyOptional({ example: 'Firmado por el Dr. García' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Base64 PNG data URL de la firma digital del médico' })
  @IsOptional()
  @IsString()
  signatureDataUrl?: string;
}
