import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PtAssistRequestStatus,
  UserPackageStatus,
} from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';
import { calcEndAt } from 'src/utils/helpers';
import { RejectPtAssistRequestDto } from './dto/reject-pt-assist-request.dto';

@Injectable()
export class PersonalTrainerService {
  constructor(private readonly prisma: PrismaService) {}

  async getPtAssistRequests(ptAccountId: string) {
    const requests = await this.prisma.ptAssistRequest.findMany({
      where: { ptAccountId },
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        branch: {
          select: { id: true, name: true, address: true },
        },
        userPackage: {
          include: {
            package: {
              select: {
                id: true,
                name: true,
                hasPt: true,
                unit: true,
                durationValue: true,
              },
            },
          },
        },
      },
    });

    return {
      message: 'Get PT assist requests successfully',
      data: requests,
    };
  }

  async acceptPtAssistRequest(ptAccountId: string, requestId: string) {
    const found = await this.prisma.ptAssistRequest.findFirst({
      where: {
        id: requestId,
        ptAccountId,
        status: PtAssistRequestStatus.PENDING,
      },
    });
    if (!found) {
      throw new NotFoundException(
        'PT assist request not found or not in PENDING status',
      );
    }

    const updated = await this.prisma.ptAssistRequest.update({
      where: { id: requestId },
      data: { status: PtAssistRequestStatus.ACCEPTED },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        branch: { select: { id: true, name: true, address: true } },
        userPackage: {
          include: {
            package: {
              select: { id: true, name: true, hasPt: true },
            },
          },
        },
      },
    });

    return {
      message: 'Accept PT assist request successfully',
      data: updated,
    };
  }

  async rejectPtAssistRequest(
    ptAccountId: string,
    requestId: string,
    dto: RejectPtAssistRequestDto,
  ) {
    const found = await this.prisma.ptAssistRequest.findFirst({
      where: {
        id: requestId,
        ptAccountId,
        status: PtAssistRequestStatus.PENDING,
      },
    });
    if (!found) {
      throw new NotFoundException(
        'PT assist request not found or not in PENDING status',
      );
    }

    const updated = await this.prisma.ptAssistRequest.update({
      where: { id: requestId },
      data: {
        status: PtAssistRequestStatus.REJECTED,
        ...(dto.rejectReason !== undefined
          ? { rejectReason: dto.rejectReason }
          : {}),
      },
      include: {
        account: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, phone: true } },
          },
        },
        branch: { select: { id: true, name: true, address: true } },
        userPackage: {
          include: {
            package: {
              select: { id: true, name: true, hasPt: true },
            },
          },
        },
      },
    });

    return {
      message: 'Reject PT assist request successfully',
      data: updated,
    };
  }

  async getRequestedPackages(ptAccountId: string) {
    const listRequestedPackages = await this.prisma.userPackage.findMany({
      where: {
        ptAccountId: ptAccountId,
        status: UserPackageStatus.PENDING,
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
          },
        },
        account: {
          select: {
            id: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });

    return {
      message: 'Get requested packages successfully',
      data: listRequestedPackages,
    };
  }

  async getAcceptedPackages(ptAccountId: string) {
    const listAcceptedPackages = await this.prisma.userPackage.findMany({
      where: {
        ptAccountId: ptAccountId,
        status: UserPackageStatus.ACTIVE,
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
          },
        },
        account: {
          select: {
            id: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    });
    return {
      message: 'Get accepted packages successfully',
      data: listAcceptedPackages,
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
