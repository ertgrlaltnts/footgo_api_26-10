import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { SendCoinDto } from './dto/send-coin.dto';
import { SendPremiumDto } from './dto/send-premium.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  create(@Body() createAdminDto: CreateAdminDto) {
    return this.adminService.create(createAdminDto);
  }

  @Post('login')
  login(@Body() loginAdminDto: LoginAdminDto) {
    return this.adminService.login(loginAdminDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminService.remove(id);
  }

  @Get(':id')
  getAdminByUsername(
    @Param('id') id: string,
    @Query('username') username: string,
  ) {
    return this.adminService.getAdminByUsername(username, id);
  }

  @Post('send-coin')
  sendCoin(@Body() sendCoinDto: SendCoinDto) {
    return this.adminService.sendCoin(sendCoinDto);
  }

  @Post('send-premium')
  sendPremium(@Body() sendPremiumDto: SendPremiumDto) {
    return this.adminService.sendPremium(sendPremiumDto);
  }
}
