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
import { PersonalTrainerService } from './personal-trainer.service';
import { AssignProgramToUserDto } from './dto/assign-program-to-user.dto';
import { RejectPtAssistRequestDto } from './dto/reject-pt-assist-request.dto';
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
  @Get('pt-assist-requests')
  async getPtAssistRequests(@Req() req: any) {
    return this.personalTrainerService.getPtAssistRequests(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PT)
  @Post('pt-assist-requests/:id/accept')
  async acceptPtAssistRequest(@Req() req: any, @Param('id') id: string) {
    return this.personalTrainerService.acceptPtAssistRequest(
      req.user.userId,
      id,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PT)
  @Post('pt-assist-requests/:id/reject')
  async rejectPtAssistRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body() rejectPtAssistRequestDto: RejectPtAssistRequestDto,
  ) {
    return this.personalTrainerService.rejectPtAssistRequest(
      req.user.userId,
      id,
      rejectPtAssistRequestDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PT)
  @Get('assist-schedule')
  async getAssistPtSchedule(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.personalTrainerService.getAssistPtSchedule(
      req.user.userId,
      from,
      to,
    );
  }

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PT)
  @Post('assign-program-to-user')
  async assignProgramToUser(@Body() dto: AssignProgramToUserDto) {
    return this.personalTrainerService.assignProgramToUser(
      dto.userPackageId,
      dto.programId,
    );
  }
}
