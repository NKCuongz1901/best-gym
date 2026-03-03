import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/decorators/roles.decorator';
import { Role } from 'generated/prisma/enums';
import { FilterPtDto } from './dto/filter-pt.dto';
import { FilterUserDto } from './dto/filter-user.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('sign-up')
  async signUp(@Body() createAccountDto: CreateAccountDto) {
    return this.accountService.createAccount(createAccountDto);
  }

  @Post('verify-account')
  async verifyAccount(@Body() verifyAccountDto: VerifyAccountDto) {
    return this.accountService.verifyAccount(verifyAccountDto);
  }

  @Get('pt-accounts')
  async getPTAccounts(@Query() filterPtDto: FilterPtDto) {
    return this.accountService.getPTAccounts(filterPtDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('user-accounts')
  async getUserAccounts(@Query() filterUserDto: FilterUserDto) {
    return this.accountService.getUserAccounts(filterUserDto);
  }
}
