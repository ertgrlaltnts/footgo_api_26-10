import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginWithPasswordDto } from './dto/login-with-password.dto';
import { RegisterWithPasswordDto } from './dto/register-with-password.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { GetUserByTokenDto } from './dto/get-user-by-token.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.usersService.findAll(paginationQuery);
  }

  @Post('search')
  searchByEmail(@Body() searchUserDto: SearchUserDto) {
    return this.usersService.searchByEmail(searchUserDto);
  }

  @Post('token')
  getUserByToken(@Body() getUserByTokenDto: GetUserByTokenDto) {
    return this.usersService.getUserByToken(getUserByTokenDto.token);
  }

  @Post('login')
  loginWithGoogle(@Body() createUserDto: CreateUserDto) {
    return this.usersService.loginWithGoogle(createUserDto);
  }

  @Post('login-password')
  loginWithPassword(@Body() loginWithPasswordDto: LoginWithPasswordDto) {
    return this.usersService.loginWithPassword(loginWithPasswordDto);
  }

  @Post('register-password')
  registerWithPassword(
    @Body() registerWithPasswordDto: RegisterWithPasswordDto,
  ) {
    return this.usersService.registerWithPassword(registerWithPasswordDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put('coin')
  updateCoin(
    @Body()
    {
      id,
      coin,
      price,
      product,
    }: {
      id: string;
      coin: number;
      price: string;
      product: string;
    },
  ) {
    return this.usersService.updateCoin({ id, coin, price, product });
  }

  @Put('premium')
  updatePremium(
    @Body()
    {
      id,
      day,
      price,
      product,
    }: {
      id: string;
      day: number;
      price: string;
      product: string;
    },
  ) {
    return this.usersService.updatePremium({ id, day, price, product });
  }

  @Put('coupon')
  buyCoupon(
    @Body()
    {
      id,
      couponId,
      couponPay,
    }: {
      id: string;
      couponId: string;
      couponPay: number;
    },
  ) {
    return this.usersService.buyCoupon({ id, couponId, couponPay });
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

