import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginWithPasswordDto {
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  @IsNotEmpty({ message: 'Email adresi zorunludur' })
  email: string;

  @IsString({ message: 'Şifre metin formatında olmalıdır' })
  @IsNotEmpty({ message: 'Şifre zorunludur' })
  password: string;
}

