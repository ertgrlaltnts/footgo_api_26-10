import { IsNotEmpty, IsString } from 'class-validator';

export class LoginAdminDto {
  @IsNotEmpty({ message: 'Kullanıcı adı boş olamaz' })
  @IsString({ message: 'Kullanıcı adı bir string olmalıdır' })
  username: string;

  @IsNotEmpty({ message: 'Şifre boş olamaz' })
  @IsString({ message: 'Şifre bir string olmalıdır' })
  password: string;
}
