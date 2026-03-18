import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserPackageService } from './user-package.service';
import { PurchasePackageDto } from './dto/purchase-package.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'generated/prisma/enums';
import { CheckinPackageDto } from './dto/checkin-package.dto';

@Controller('user-package')
export class UserPackageController {
  constructor(private readonly userPackageService: UserPackageService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('purchase')
  async purchasePackage(
    @Req() req: any,
    @Body() purchasePackageDto: PurchasePackageDto,
  ) {
    return this.userPackageService.purchasePackage(
      req.user.userId,
      purchasePackageDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('my-packages')
  async getUserPackages(@Req() req: any) {
    return this.userPackageService.getUserPackages(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Get('my-packages/:id')
  async getUserDetailPackage(@Req() req: any, @Param('id') id: string) {
    return this.userPackageService.getUserDetailPackage(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.USER)
  @Post('checkin')
  async checkinPackage(
    @Req() req: any,
    @Body() checkinPackageDto: CheckinPackageDto,
  ) {
    return this.userPackageService.checkinPackage(
      req.user.userId,
      checkinPackageDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('checkins')
  async getCheckins(@Req() req: any) {
    return this.userPackageService.getCheckins(req.user.userId);
  }

  @Get('checkins/grouped')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getGrouped(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.userPackageService.getCheckinsGrouped(
      req.user.userId,
      from,
      to,
    );
  }
}
