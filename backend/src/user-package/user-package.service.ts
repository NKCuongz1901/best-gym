import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PurchasePackageDto } from './dto/purchase-package.dto';
import { AccountStatus, Role, UserPackageStatus } from 'generated/prisma/enums';
import { calcEndAt } from 'src/utils/helpers';

@Injectable()
export class UserPackageService {
  constructor(private readonly prisma: PrismaService) {}

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
}
