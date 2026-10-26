import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { CreatePredictionDto } from './dto/create-prediction.dto';
import { PaginationDto } from './dto/pagination.dto';
import { GroupedPredictionsQueryDto } from './dto/grouped-predictions-query.dto';

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Get('grouped')
  findGroupedPredictions(@Query() query: GroupedPredictionsQueryDto) {
    return this.predictionsService.findGroupedPredictions(query);
  }

  @Get('wait')
  findOnlyWaiting() {
    return this.predictionsService.findOnlyWaiting();
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.predictionsService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.predictionsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.OK) // 200 döndür
  create(@Body() createPredictionDto: CreatePredictionDto) {
    return this.predictionsService.create(createPredictionDto);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updatePredictionDto: CreatePredictionDto,
  ) {
    return this.predictionsService.update(id, updatePredictionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.predictionsService.remove(id);
  }
}

