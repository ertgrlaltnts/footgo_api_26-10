import { IsNotEmpty, IsString } from 'class-validator';

export class GetUserByTokenDto {
  @IsNotEmpty({ message: 'Token boş olamaz' })
  @IsString({ message: 'Token bir string olmalıdır' })
  token: string;
}

