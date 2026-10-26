import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class RegisterPushDeviceDto {
  @IsString()
  @IsNotEmpty({ message: 'Expo push token zorunludur' })
  token: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  locale?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  platform?: string;
}
