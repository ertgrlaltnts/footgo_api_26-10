import { IsOptional, Matches } from 'class-validator';

/**
 * Mobil uygulamadan kullanıcının yerel saat dilimindeki tarih gönderilmelidir.
 * Böylece gece yarısından sonra sunucu UTC'si yerine kullanıcının "bugünü" kullanılır.
 */
export class GroupedPredictionsQueryDto {
  @IsOptional()
  @Matches(/^\d{2}\.\d{2}\.\d{4}$/, {
    message: 'date alanı DD.MM.YYYY formatında olmalıdır (örn: 29.05.2026)',
  })
  date?: string;
}

