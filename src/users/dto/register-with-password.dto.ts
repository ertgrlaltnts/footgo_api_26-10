import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class RegisterWithPasswordDto {
  @IsEmail({}, { message: 'Gecerli bir email adresi giriniz' })
  @IsNotEmpty({ message: 'Email adresi zorunludur' })
  email: string;

  @IsString({ message: 'Sifre metin formatinda olmalidir' })
  @IsNotEmpty({ message: 'Sifre zorunludur' })
  password: string;

  @IsString({ message: 'Isim metin formatinda olmalidir' })
  @IsNotEmpty({ message: 'Isim zorunludur' })
  name: string;

  @IsUrl({}, { message: "Gecerli bir profil fotografi URL'si giriniz" })
  @IsNotEmpty({ message: 'Profil fotografi zorunludur' })
  profilePhoto: string;
}

