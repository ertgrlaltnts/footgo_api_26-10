import { IsEmail, IsNotEmpty } from 'class-validator';

export class SearchUserDto {
  @IsNotEmpty({ message: 'Email adresi boş olamaz' })
  @IsEmail({}, { message: 'Geçerli bir email adresi giriniz' })
  email: string;
}
