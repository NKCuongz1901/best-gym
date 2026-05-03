import { PtAssistRequestStatus, Role, UserPackageStatus } from 'generated/prisma/enums';
import { AdminAnalyticsService } from './admin-analytics.service';

describe('AdminAnalyticsService', () => {
  const prismaMock = {
    userPackage: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    account: {
      count: jest.fn(),
    },
    checkIn: {
      count: jest.fn(),
    },
    ptAssistRequest: {
      count: jest.fn(),
    },
  };

  let service: AdminAnalyticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminAnalyticsService(prismaMock as any);
  });

  it('builds revenue timeseries grouped by day', async () => {
    prismaMock.userPackage.findMany.mockResolvedValue([
      {
        createdAt: new Date('2026-05-01T03:00:00.000Z'),
        status: UserPackageStatus.ACTIVE,
        packageId: 'pkg-1',
        package: { name: 'P1', price: 100000 },
        branchId: 'br-1',
        branch: { name: 'B1' },
      },
      {
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        status: UserPackageStatus.PENDING,
        packageId: 'pkg-1',
        package: { name: 'P1', price: 100000 },
        branchId: 'br-1',
        branch: { name: 'B1' },
      },
    ]);

    const result = await service.getRevenueTimeseries({
      from: '2026-05-01',
      to: '2026-05-31',
      groupBy: 'day',
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual(
      expect.objectContaining({
        grossRevenue: 200000,
        activeRevenue: 100000,
        purchasesCount: 2,
      }),
    );
  });

  it('returns operations metrics counts', async () => {
    prismaMock.account.count.mockResolvedValue(5);
    prismaMock.userPackage.count.mockResolvedValue(3);
    prismaMock.checkIn.count.mockResolvedValue(9);
    prismaMock.ptAssistRequest.count.mockResolvedValue(7);

    const result = await service.getOperations({
      from: '2026-05-01',
      to: '2026-05-31',
      branchId: '5fd90f4b-6b1a-4d82-a65e-080f2925d0af',
    });

    expect(result.data).toEqual({
      newUsers: 5,
      activePackages: 3,
      checkins: 9,
      ptAcceptedSessions: 7,
    });

    expect(prismaMock.ptAssistRequest.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: PtAssistRequestStatus.ACCEPTED,
        }),
      }),
    );
    expect(prismaMock.account.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: Role.USER,
        }),
      }),
    );
  });
});
