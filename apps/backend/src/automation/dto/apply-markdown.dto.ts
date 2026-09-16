import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class ApplyMarkdownDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @IsPositive()
  discountedPrice: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
