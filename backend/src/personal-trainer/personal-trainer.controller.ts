import { Controller, Get, Req, UseGuards } from '@nestjs/common';
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
}
