import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  @IsNotEmpty({ message: 'Email adresi zorunludur' })
  email: string;

  @IsString({ message: 'İsim metin formatında olmalıdır' })
  @IsNotEmpty({ message: 'İsim zorunludur' })
  name: string;

  @IsUrl({}, { message: "Geçerli bir profil fotoğrafı URL'si giriniz" })
  @IsNotEmpty({ message: 'Profil fotoğrafı zorunludur' })
  profilePhoto: string;

  @IsString({ message: 'Şifre metin formatında olmalıdır' })
  @IsOptional()
  password?: string;
}

