import { IsNotEmpty, IsString, IsEmail } from 'class-validator';

export class CreatePaymentDto {
  @IsNotEmpty({ message: 'Kullanıcı ID zorunludur' })
  @IsString({ message: 'Kullanıcı ID metin formatında olmalıdır' })
  userId: string;

  @IsString({ message: 'Kullanıcı fotoğrafı metin formatında olmalıdır' })
  @IsNotEmpty({ message: 'Kullanıcı fotoğrafı zorunludur' })
  userPhoto: string;

  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  @IsNotEmpty({ message: 'Email adresi zorunludur' })
  userEmail: string;

  @IsString({ message: 'Kullanıcı adı metin formatında olmalıdır' })
  @IsNotEmpty({ message: 'Kullanıcı adı zorunludur' })
  userName: string;

  @IsString({ message: 'Ürün adı metin formatında olmalıdır' })
  @IsNotEmpty({ message: 'Ürün adı zorunludur' })
  product: string;

  @IsString({ message: 'Fiyat metin formatında olmalıdır' })
  @IsNotEmpty({ message: 'Fiyat zorunludur' })
  price: string;
}
