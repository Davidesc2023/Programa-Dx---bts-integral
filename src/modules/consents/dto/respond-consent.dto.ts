import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum PatientResponse {
  ACEPTADO = 'ACEPTADO',
  RECHAZADO = 'RECHAZADO',
}

export class RespondConsentDto {
  @ApiProperty({ enum: PatientResponse, example: PatientResponse.ACEPTADO })
  @IsEnum(PatientResponse)
  response: PatientResponse;
}
