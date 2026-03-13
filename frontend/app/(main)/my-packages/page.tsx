'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Result, Spin } from 'antd';
import { motion } from 'motion/react';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons';

import { getMyPurchasePackages } from '@/app/services/api';
import type { MyPurchasePackage } from '@/app/types/types';
import { useAuthStore } from '@/app/stores/authStore';

const statusMap: Record<
  MyPurchasePackage['status'],
  { label: string; className: string }
> = {
  PENDING: { label: 'Chờ kích hoạt', className: 'bg-yellow-50 text-yellow-700' },
  ACTIVE: { label: 'Đang hoạt động', className: 'bg-green-50 text-green-700' },
  EXPIRED: { label: 'Hết hạn', className: 'bg-red-50 text-red-600' },
  CANCELLED: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-600' },
  REJECTED: { label: 'Bị từ chối', className: 'bg-red-50 text-red-600' },
};

export default function MyPackagesPage() {
  const router = useRouter();
  const { isLoggedIn, loading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-packages'],
    queryFn: () => getMyPurchasePackages(),
    enabled: isLoggedIn,
  });

  const purchases: MyPurchasePackage[] = data?.data ?? [];

  if (!isLoggedIn && !authLoading) {
    return (
      <Result
        status="warning"
        title="Vui lòng đăng nhập để xem gói tập của bạn"
      />
    );
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 pt-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
        >
          ← Quay lại
        </button>

        <h1 className="mb-6 text-3xl font-bold text-neutral-900">
          Gói tập của tôi
        </h1>

        {purchases.length === 0 ? (
          <Result
            icon={null}
            title="Bạn chưa có gói tập nào"
            subTitle="Hãy đăng ký gói tập để bắt đầu hành trình luyện tập cùng PowerFit."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {purchases.map((item, index) => {
              const status = statusMap[item.status];
              const pkg = item.package;
              const branch = item.branch;
              const pt = item.ptAccount;

              const unitLabel = pkg.unit === 'DAY' ? 'ngày' : 'tháng';
              const durationText = `${pkg.durationValue} ${unitLabel}`;
              const priceText = `${new Intl.NumberFormat('vi-VN').format(
                pkg.price,
              )}₫`;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">
                        {pkg.name}
                      </h3>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
                        {durationText}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <p className="mb-3 text-2xl font-bold text-primary">
                    {priceText}
                    <span className="text-sm font-normal text-neutral-500">
                      /{unitLabel}
                    </span>
                  </p>

                  <div className="space-y-2 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                      <EnvironmentOutlined className="text-primary" />
                      <span>
                        {branch.name}
                        {branch.address ? ` - ${branch.address}` : ''}
                      </span>
                    </div>
                    {pt && (
                      <div className="flex items-center gap-2">
                        <UserOutlined className="text-primary" />
                        <span>
                          PT:{' '}
                          {pt.profile?.name
                            ? pt.profile.name
                            : pt.email}
                        </span>
                      </div>
                    )}
                    {(item.startAt || item.endAt) && (
                      <div className="flex items-center gap-2">
                        <CalendarOutlined className="text-primary" />
                        <span>
                          {item.startAt &&
                            `Từ ${new Date(
                              item.startAt,
                            ).toLocaleDateString('vi-VN')}`}
                          {item.endAt &&
                            ` đến ${new Date(
                              item.endAt,
                            ).toLocaleDateString('vi-VN')}`}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

