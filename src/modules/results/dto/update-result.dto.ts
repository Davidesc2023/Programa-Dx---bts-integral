import { IsOptional, IsString } from 'class-validator';

export class UpdateResultDto {
  @IsOptional()
  @IsString()
  examType?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  referenceRange?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
