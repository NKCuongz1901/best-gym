import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { PersonalTrainerService } from './personal-trainer.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'generated/prisma/enums';

@Controller('pt')
export class PersonalTrainerController {
  constructor(
    private readonly personalTrainerService: PersonalTrainerService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PT)
  @Get('requested-packages')
  async getRequestedPackages(@Req() req: any) {
    return this.personalTrainerService.getRequestedPackages(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PT)
  @Get('accepted-packages')
  async getAcceptedPackages(@Req() req: any) {
    return this.personalTrainerService.getAcceptedPackages(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PT)
  @Post('accepted-request/:id')
  async acceptedRequest(@Req() req: any, @Param('id') id: string) {
    return this.personalTrainerService.acceptedRequest(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PT)
  @Post('rejected-request/:id')
  async rejectedRequest(@Req() req: any, @Param('id') id: string) {
    return this.personalTrainerService.rejectedRequest(req.user.userId, id);
  }
}
