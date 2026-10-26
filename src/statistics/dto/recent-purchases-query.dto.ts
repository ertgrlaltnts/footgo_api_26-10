import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class RecentPurchasesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  limit?: number = 5;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  hours?: number; // Son X saat içindeki satın alımlar
}

