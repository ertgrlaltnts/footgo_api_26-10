import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class NotificationContentDto {
  @IsOptional()
  @IsString()
  en?: string;

  @IsOptional()
  @IsString()
  tr?: string;

  @IsOptional()
  @IsString()
  fr?: string;

  @IsOptional()
  @IsString()
  es?: string;
}

export class SendNotificationDto {
  @IsNotEmpty({ message: 'Başlık zorunludur' })
  @IsObject({ message: 'Başlık obje formatında olmalıdır' })
  @ValidateNested()
  @Type(() => NotificationContentDto)
  headings: NotificationContentDto;

  @IsNotEmpty({ message: 'İçerik zorunludur' })
  @IsObject({ message: 'İçerik obje formatında olmalıdır' })
  @ValidateNested()
  @Type(() => NotificationContentDto)
  contents: NotificationContentDto;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsBoolean()
  saveToDatabase?: boolean;
}
