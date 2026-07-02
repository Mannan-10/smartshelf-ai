import { IsDateString, IsInt, IsNumber, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class CreatePurchaseItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string; // NEW: optional expiry date per line item
}