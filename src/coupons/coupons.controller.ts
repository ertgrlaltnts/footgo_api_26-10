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
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { GroupedCouponsQueryDto } from './dto/grouped-coupons-query.dto';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get('wait')
  findOnlyWaiting() {
    return this.couponsService.findOnlyWaiting();
  }

  @Get('grouped')
  findByDateRange(@Query() query: GroupedCouponsQueryDto) {
    return this.couponsService.findByDateRange(query);
  }

  @Get()
  findAll(@Query() paginationQuery: PaginationQueryDto) {
    return this.couponsService.findAll(paginationQuery);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Post()
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateCouponDto: CreateCouponDto) {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }
}

