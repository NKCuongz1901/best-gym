import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import {
  generateVerificationCode,
  getExpirationTime,
  hashPassword,
} from 'src/utils/helpers';
import { MailService } from 'src/mail/mail.service';
import { VerifyAccountDto } from './dto/verify-account.dto';
import { AccountStatus, Role } from 'generated/prisma/enums';
import { FilterPtDto } from './dto/filter-pt.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

    await this.prisma.profile.create({
      data: {
        accountId: account.id,
      },
    });

    await this.mailService.sendVerificationEmail(
      email,
      verificationCode,
      email,
    );
    return account;
  }

  async getMyProfile(accountId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { accountId },
      include: {
        account: { select: { email: true } },
      },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const { account, ...profileFields } = profile;
    return {
      message: 'Get profile successfully',
      data: {
        ...profileFields,
        email: account.email,
      },
    };
  }

  async updateMyProfile(accountId: string, updateProfileDto: UpdateProfileDto) {
    const { dateOfBirth, ...rest } = updateProfileDto;

    const profile = await this.prisma.profile.upsert({
      where: { accountId },
      create: {
        accountId,
        ...rest,
        ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      },
      update: {
        ...rest,
        ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
      },
      include: {
        account: { select: { email: true } },
      },
    });

    const { account, ...profileFields } = profile;
    return {
      message: 'Update profile successfully',
      data: {
        ...profileFields,
        email: account.email,
      },
    };
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

  async getPTAccounts(filterPtDto: FilterPtDto) {
    const { page = 1, itemsPerPage = 10, search = '' } = filterPtDto;
    const skip = (page - 1) * itemsPerPage;

    const whereCondition = search
      ? {
          email: {
            contains: search,
          },
          role: Role.PT,
          status: AccountStatus.ACTIVE,
        }
      : {
          role: Role.PT,
          status: AccountStatus.ACTIVE,
        };
    const total = await this.prisma.account.count({
      where: whereCondition,
    });

    const totalPages = Math.ceil(total / itemsPerPage);
    const ptAccounts = await this.prisma.account.findMany({
      where: whereCondition,
      skip,
      take: itemsPerPage,
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            name: true,
            gender: true,
            phone: true,
            dateOfBirth: true,
            avatar: true,
            height: true,
            weight: true,
            fitnessGoal: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return {
      message: 'Get PT accounts successfully',
      meta: {
        page,
        itemsPerPage,
        total,
        totalPages,
      },
      data: ptAccounts,
    };
  }

  async getUserAccounts(filterUserDto: FilterUserDto) {
    const { page = 1, itemsPerPage = 10, search = '' } = filterUserDto;
    const skip = (page - 1) * itemsPerPage;

    const whereCondition = search
      ? {
          email: {
            contains: search,
          },
          role: Role.USER,
          status: AccountStatus.ACTIVE,
        }
      : {
          role: Role.USER,
          status: AccountStatus.ACTIVE,
        };
    const total = await this.prisma.account.count({
      where: whereCondition,
    });
    const totalPages = Math.ceil(total / itemsPerPage);
    const userAccounts = await this.prisma.account.findMany({
      where: whereCondition,
      skip,
      take: itemsPerPage,
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return {
      message: 'Get user accounts successfully',
      meta: {
        page,
        itemsPerPage,
        total,
        totalPages,
      },
      data: userAccounts,
    };
  }
}
