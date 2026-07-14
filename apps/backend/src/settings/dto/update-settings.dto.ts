import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  shopName?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @MaxLength(3)
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
