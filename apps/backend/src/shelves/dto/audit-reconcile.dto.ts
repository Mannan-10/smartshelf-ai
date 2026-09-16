import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class AuditItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(0)
  countedQuantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AuditReconcileDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AuditItemDto)
  items: AuditItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
