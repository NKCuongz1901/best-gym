import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PurchasePackageDto } from './dto/purchase-package.dto';
import { CreatePtAssistRequestDto } from './dto/create-pt-assist-request.dto';
import {
  AccountStatus,
  PtAssistRequestStatus,
  Role,
  UserPackageStatus,
} from 'generated/prisma/enums';
import { calcEndAt } from 'src/utils/helpers';
import { CheckinPackageDto } from './dto/checkin-package.dto';
import { FilterPtTrainingHistoryDto } from './dto/filter-pt-training-history.dto';
import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class UserPackageService {
  constructor(private readonly prisma: PrismaService) {}

  private getProgramDayOfWeekToday(): number {
    // ProgramDay.dayOfWeek is 1..7 (based on CreateProgramDayDto validation)
    // JS getDay(): 0..6 with Sunday=0 => map Sunday -> 7, others keep 1..6
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 7 : jsDay;
  }

  async getTodayExercises(accountId: string) {
    const userPackage = await this.prisma.userPackage.findFirst({
      where: {
        accountId,
        status: UserPackageStatus.ACTIVE,
      },
      select: {
        id: true,
        programId: true,
        startAt: true,
        endAt: true,
        expiredAt: true,
      },
      orderBy: {
        activatedAt: 'desc',
      },
    });

    if (!userPackage) {
      throw new NotFoundException('Active user package not found');
    }

    const now = new Date();
    const endAt = userPackage.endAt ?? userPackage.expiredAt ?? undefined;
    if (endAt && now > endAt) {
      throw new BadRequestException('User package has expired');
    }

    if (!userPackage.programId) {
      throw new BadRequestException('This user package has no program assigned');
    }

    const dayOfWeek = this.getProgramDayOfWeekToday();

    const programDay = await this.prisma.programDay.findUnique({
      where: {
        programId_dayOfWeek: {
          programId: userPackage.programId,
          dayOfWeek,
        },
      },
      include: {
        exercises: {
          orderBy: { sortOrder: 'asc' },
          include: {
            exercise: true,
          },
        },
      },
    });

    if (!programDay) {
      return {
        message: 'No workout scheduled for today',
        data: {
          dayOfWeek,
          programDay: null,
          exercises: [],
        },
      };
    }

    return {
      message: 'Get today exercises successfully',
      data: {
        dayOfWeek,
        programDay: {
          id: programDay.id,
          programId: programDay.programId,
          dayOfWeek: programDay.dayOfWeek,
          title: programDay.title,
          note: programDay.note,
        },
        exercises: programDay.exercises.map((pde) => ({
          id: pde.id,
          sortOrder: pde.sortOrder,
          exercise: pde.exercise,
        })),
      },
    };
  }

  async purchasePackage(
    accountId: string,
    purchasePackageDto: PurchasePackageDto,
  ) {
    const { packageId, branchId, ptAccountId } = purchasePackageDto;

    const newPackage = await this.prisma.package.findUnique({
      where: {
        id: packageId,
      },
    });
    if (!newPackage) {
      throw new NotFoundException('Package not found');
    }

    const selectedBranch = await this.prisma.branch.findUnique({
      where: {
        id: branchId,
        isActive: true,
      },
    });
    if (!selectedBranch) {
      throw new NotFoundException('Branch not found');
    }

    if (newPackage.hasPt) {
      const selectedPtAccount = await this.prisma.account.findUnique({
        where: {
          id: ptAccountId,
          role: Role.PT,
          status: AccountStatus.ACTIVE,
        },
      });
      if (!selectedPtAccount) {
        throw new NotFoundException('PT account not found');
      }

      const userPackage = await this.prisma.userPackage.create({
        data: {
          accountId,
          branchId,
          packageId,
          ptAccountId,
          status: UserPackageStatus.PENDING,
        },
      });

      return {
        message: 'Purchase package successfully',
        data: userPackage,
      };
    }

    // Purchase package without PT
    const startAt = new Date();
    const endAt = calcEndAt(startAt, newPackage.unit, newPackage.durationValue);
    const userPackage = await this.prisma.userPackage.create({
      data: {
        accountId,
        branchId,
        packageId,
        status: UserPackageStatus.ACTIVE,
        activatedAt: startAt,
        startAt,
        endAt,
        expiredAt: endAt,
      },
    });

    return {
      message: 'Purchase package successfully',
      data: userPackage,
    };
  }

  async getUserPackages(accountId: string) {
    const userPackages = await this.prisma.userPackage.findMany({
      where: {
        accountId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            unit: true,
            durationValue: true,
            hasPt: true,
            price: true,
            description: true,
          },
        },
        ptAccount: {
          select: {
            id: true,
            profile: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Get user packages successfully',
      data: userPackages,
    };
  }
  async getUserDetailPackage(accountId: string, userPackageId: string) {
    const userPackage = await this.prisma.userPackage.findUnique({
      where: {
        id: userPackageId,
        accountId,
      },
      include: {
        package: true,
        branch: true,
        ptAccount: true,
      },
    });
    if (!userPackage) {
      throw new NotFoundException('User package not found');
    }
    return {
      message: 'Get user detail package successfully',
      data: userPackage,
    };
  }

  async checkinPackage(
    accountId: string,
    checkinPackageDto: CheckinPackageDto,
  ) {
    const { userPackageId, branchId } = checkinPackageDto;

    const userPackage = await this.prisma.userPackage.findUnique({
      where: {
        id: userPackageId,
        accountId,
        branchId,
        status: UserPackageStatus.ACTIVE,
      },
    });
    if (!userPackage) {
      throw new NotFoundException('User package not found');
    }

    const now = new Date();
    if (userPackage.expiredAt && now > userPackage.expiredAt) {
      throw new BadRequestException('User package has expired');
    }

    const checkin = await this.prisma.checkIn.create({
      data: {
        accountId,
        userPackageId,
        branchId,
        checkedInAt: now,
      },
    });
    return {
      message: 'Checkin package successfully',
      data: checkin,
    };
  }

  async getPtTrainingHistory(
    accountId: string,
    filter?: FilterPtTrainingHistoryDto,
  ) {
    const { from, to } = filter ?? {};

    const where: {
      accountId: string;
      startTime?: { gte?: Date; lte?: Date };
    } = { accountId };

    if (from || to) {
      where.startTime = {};
      if (from) {
        where.startTime.gte = new Date(`${from}T00:00:00.000Z`);
      }
      if (to) {
        where.startTime.lte = new Date(`${to}T23:59:59.999Z`);
      }
    }

    const items = await this.prisma.ptAssistRequest.findMany({
      where,
      orderBy: { startTime: 'desc' },
      include: {
        branch: {
          select: { id: true, name: true, address: true },
        },
        ptAccount: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        userPackage: {
          include: {
            package: {
              select: { id: true, name: true, hasPt: true },
            },
          },
        },
        sessionReport: true,
      },
    });

    return {
      message: 'Get PT training history successfully',
      data: items,
    };
  }

  async getCheckins(accountId: string) {
    const checkins = await this.prisma.checkIn.findMany({
      where: {
        accountId,
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    });

    return {
      message: 'Get checkins successfully',
      data: checkins,
    };
  }

  async getCheckinsGrouped(accountId: string, from?: string, to?: string) {
    const tz = 'Asia/Ho_Chi_Minh';

    const where: any = { accountId };

    if (from || to) {
      where.checkedInAt = {};
      if (from) where.checkedInAt.gte = new Date(`${from}T00:00:00.000Z`);
      if (to) where.checkedInAt.lte = new Date(`${to}T23:59:59.999Z`);
    }

    const checkins = await this.prisma.checkIn.findMany({
      where,
      select: {
        id: true,
        userPackageId: true,
        checkedInAt: true,
        branch: {
          select: { id: true, name: true },
        },
      },
      orderBy: { checkedInAt: 'desc' },
    });

    const grouped: Record<
      string,
      Array<{
        id: string;
        userPackageId: string;
        checkedInAt: Date;
        branch: { id: string; name: string };
      }>
    > = {};

    for (const c of checkins) {
      const dayKey = formatInTimeZone(c.checkedInAt, tz, 'yyyy-MM-dd');
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(c);
    }

    return {
      message: 'Get checkins successfully',
      data: grouped,
    };
  }

  async createRequestPT(accountId: string, dto: CreatePtAssistRequestDto) {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid startTime or endTime');
    }
    if (end <= start) {
      throw new BadRequestException('endTime must be greater than startTime');
    }

    // const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    // if (durationMinutes < 30 || durationMinutes > 180) {
    //   throw new BadRequestException(
    //     'Session duration must be between 30 and 180 minutes',
    //   );
    // }

    return this.prisma.$transaction(async (tx) => {
      const userPackage = await tx.userPackage.findUnique({
        where: { id: dto.userPackageId },
        include: { package: true },
      });

      if (!userPackage) {
        throw new NotFoundException('UserPackage not found');
      }
      if (userPackage.accountId !== accountId) {
        throw new ForbiddenException('Not your package');
      }

      if (userPackage.status !== UserPackageStatus.ACTIVE) {
        throw new BadRequestException('UserPackage is not ACTIVE');
      }
      if (!userPackage.startAt || !userPackage.endAt) {
        throw new BadRequestException('UserPackage has no valid time range');
      }

      const now = new Date();
      if (now < userPackage.startAt || now > userPackage.endAt) {
        throw new BadRequestException(
          'UserPackage is expired or not started yet',
        );
      }

      if (!userPackage.package.hasPt) {
        throw new BadRequestException('This package does not include PT');
      }

      if (!userPackage.ptAccountId) {
        throw new BadRequestException('No PT assigned to this UserPackage');
      }

      if (start < userPackage.startAt || start > userPackage.endAt) {
        throw new BadRequestException(
          'Requested time is outside package validity',
        );
      }

      const conflict = await tx.ptAssistRequest.findFirst({
        where: {
          ptAccountId: userPackage.ptAccountId,
          status: PtAssistRequestStatus.ACCEPTED,
          startTime: { lt: end },
          endTime: { gt: start },
        },
        select: { id: true },
      });

      if (conflict) {
        throw new BadRequestException('PT is not available in this time slot');
      }

      const dupPending = await tx.ptAssistRequest.findFirst({
        where: {
          accountId,
          ptAccountId: userPackage.ptAccountId,
          status: PtAssistRequestStatus.PENDING,
          startTime: { lt: end },
          endTime: { gt: start },
        },
        select: { id: true },
      });

      if (dupPending) {
        throw new BadRequestException(
          'You already have a pending request in this time slot',
        );
      }

      const created = await tx.ptAssistRequest.create({
        data: {
          accountId,
          userPackageId: userPackage.id,
          branchId: userPackage.branchId,
          ptAccountId: userPackage.ptAccountId,
          startTime: start,
          endTime: end,
          note: dto.note,
          status: PtAssistRequestStatus.PENDING,
        },
        include: {
          branch: { select: { id: true, name: true } },
          ptAccount: { select: { id: true, email: true } },
        },
      });

      return {
        message: 'Create PT assist request successfully',
        data: created,
      };
    });
  }
}
