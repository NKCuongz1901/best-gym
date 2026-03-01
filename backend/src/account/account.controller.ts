import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { VerifyAccountDto } from './dto/verify-account.dto';

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
  async getPTAccounts() {
    return this.accountService.getPTAccounts();
  }
}
