import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import {
  generateVerificationCode,
  getExpirationTime,
  hashPassword,
} from 'src/utils/helpers';
import { MailService } from 'src/mail/mail.service';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { AccountStatus } from 'generated/prisma/enums';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async isEmailExists(email: string) {
    const account = await this.prisma.account.findUnique({
      where: {
        email: email,
      },
    });
    return !!account;
  }

  async createAccount(createAccountDto: CreateAccountDto) {
    const { email, password, confirmPassword } = createAccountDto;
    const hashedPassword = await hashPassword(password);
    const verificationCode = generateVerificationCode();
    const expirationTime = getExpirationTime(10);

    const accountExists = await this.isEmailExists(email);
    if (accountExists) {
      throw new BadRequestException('Email already exists');
    }

    if (password !== confirmPassword) {
      throw new BadRequestException(
        'Password and confirm password do not match',
      );
    }

    const account = await this.prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        verificationCode,
        verificationCodeExpire: expirationTime,
      },
    });
    if (!account) {
      throw new BadRequestException('Failed to create account');
    }

    await this.mailService.sendVerificationEmail(
      email,
      verificationCode,
      email,
    );
    return account;
  }

  async verifyAccount(verifyAccountDto: VerifyAccountDto) {
    const { email, verificationCode } = verifyAccountDto;
    const account = await this.prisma.account.findUnique({
      where: {
        email: email,
        verificationCode: verificationCode,
        verificationCodeExpire: {
          gt: new Date(),
        },
      },
    });
    if (!account) {
      throw new BadRequestException('Invalid verification code');
    }

    const updatedAccount = await this.prisma.account.update({
      where: {
        id: account.id,
      },
      data: {
        status: AccountStatus.ACTIVE,
        verificationCode: null,
        verificationCodeExpire: null,
      },
    });
    return {
      message: 'Account verified successfully',
      account: updatedAccount,
    };
  }
}
