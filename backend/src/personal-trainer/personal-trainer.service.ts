import { Injectable, NotFoundException } from '@nestjs/common';
import { UserPackageStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { calcEndAt } from 'src/utils/helpers';

@Injectable()
export class PersonalTrainerService {
  constructor(private readonly prisma: PrismaService) {}

  async getRequestedPackages(ptAccountId: string) {
    const listRequestedPackages = await this.prisma.userPackage.findMany({
      where: {
        ptAccountId: ptAccountId,
        status: UserPackageStatus.PENDING,
      },
    });

    return {
      message: 'Get requested packages successfully',
      data: listRequestedPackages,
    };
  }

  async acceptedRequest(ptAccountId: string, userPackageId: string) {
    const requestedPackage = await this.prisma.userPackage.findUnique({
      where: {
        id: userPackageId,
        ptAccountId: ptAccountId,
        status: UserPackageStatus.PENDING,
      },
      include: {
        package: true,
      },
    });
    if (!requestedPackage) {
      throw new NotFoundException('Requested package not found');
    }
    const now = new Date();
    const endAt = calcEndAt(
      now,
      requestedPackage.package.unit,
      requestedPackage.package.durationValue,
    );
    const updatedRequestedPackage = await this.prisma.userPackage.update({
      where: { id: userPackageId },
      data: {
        status: UserPackageStatus.ACTIVE,
        startAt: now,
        endAt: endAt,
        activatedAt: now,
        expiredAt: endAt,
      },
    });
    return {
      message: 'Accepted request successfully',
      data: updatedRequestedPackage,
    };
  }

  async rejectedRequest(ptAccountId: string, userPackageId: string) {
    const requestedPackage = await this.prisma.userPackage.update({
      where: {
        id: userPackageId,
        ptAccountId: ptAccountId,
        status: UserPackageStatus.PENDING,
      },
      data: { status: UserPackageStatus.REJECTED },
    });
    return {
      message: 'Rejected request successfully',
      data: requestedPackage,
    };
  }
}
