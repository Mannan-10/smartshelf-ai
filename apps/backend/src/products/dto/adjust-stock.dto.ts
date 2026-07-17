import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  @IsNotEmpty()
  quantityChange: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  note?: string;
}
