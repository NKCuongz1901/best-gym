import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExcerciseService } from './excercise.service';
import { CreateExcerciseDto } from './dto/create-excercise.dto';
import { FilterExcerciseDto } from './dto/filter-excercise.dto';
import { UpdateExcerciseDto } from './dto/update-excercise.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'generated/prisma/enums';

@Controller('excercise')
export class ExcerciseController {
  constructor(private readonly excerciseService: ExcerciseService) {}

  @Get()
  findAll(@Query() filterExcerciseDto: FilterExcerciseDto) {
    return this.excerciseService.findAll(filterExcerciseDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.excerciseService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async create(@Body() createExcerciseDto: CreateExcerciseDto) {
    return this.excerciseService.create(createExcerciseDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateExcerciseDto: UpdateExcerciseDto,
  ) {
    return this.excerciseService.update(id, updateExcerciseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.excerciseService.remove(id);
  }
}
