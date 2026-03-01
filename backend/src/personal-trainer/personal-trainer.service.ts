import { Injectable } from '@nestjs/common';
import { UserPackageStatus } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

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
}
