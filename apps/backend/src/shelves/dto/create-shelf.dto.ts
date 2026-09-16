import { IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateShelfDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  @IsString()
  @MaxLength(50)
  aisle: string;

  @IsString()
  @MaxLength(50)
  rack: string;

  @IsString()
  @MaxLength(50)
  shelf: string;

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
