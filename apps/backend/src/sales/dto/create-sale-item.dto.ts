import { IsInt, IsPositive, IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateSaleItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}
