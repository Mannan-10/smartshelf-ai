import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class UpdateShelfDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  aisle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  rack?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shelf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bin?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  capacity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  notes?: string;
}
