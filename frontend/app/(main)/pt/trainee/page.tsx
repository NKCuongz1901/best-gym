'use client';

import { useMemo, useState } from 'react';
import { Tabs, Spin } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';

import {
  getAcceptedTraineeRequests,
  getTraineeRequests,
  approveTraineeRequest,
  rejectTraineeRequest,
} from '@/app/services/api';
import type { TraineeRequest } from '@/app/types/types';
import TraineeCard from '@/app/components/pt/TraineeCard';
import { useAuthStore } from '@/app/stores/authStore';

export default function TraineePage() {
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'active'>('pending');

  const { data: pendingData, isLoading: isLoadingPending } = useQuery({
    queryKey: ['pt-trainee-pending'],
    queryFn: () => getTraineeRequests(),
    enabled: isLoggedIn && user?.role === 'PT',
  });

  const pendingList: TraineeRequest[] = useMemo(
    () => pendingData?.data ?? [],
    [pendingData],
  );

  const { data: activeData, isLoading: isLoadingActive } = useQuery({
    queryKey: ['pt-trainee-active'],
    queryFn: () => getAcceptedTraineeRequests(),
    enabled: isLoggedIn && user?.role === 'PT',
  });

  const activeList: TraineeRequest[] = useMemo(
    () => activeData?.data ?? [],
    [activeData],
  );

  const { mutate: approveRequest, isPending: isApproving } = useMutation({
    mutationFn: (trainee: TraineeRequest) =>
      approveTraineeRequest({ requestId: trainee.id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['pt-trainee-pending'] });
      queryClient.invalidateQueries({ queryKey: ['pt-trainee-active'] });
      const trainee = res.data as TraineeRequest;
      const name = trainee.account.profile?.name ?? trainee.account.email;
      message.success(`Đã duyệt học viên ${name}.`);
    },
  });

  const { mutate: rejectRequest, isPending: isRejecting } = useMutation({
    mutationFn: (trainee: TraineeRequest) =>
      rejectTraineeRequest({ requestId: trainee.id }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['pt-trainee-pending'] });
      const trainee = res.data as TraineeRequest;
      const name = trainee.account.profile?.name ?? trainee.account.email;
      message.info(`Đã từ chối yêu cầu của ${name}.`);
    },
  });

  return (
    <div className="min-h-screen bg-background pb-16 pt-10">
      <div className="mx-auto w-full max-w-6xl px-4">
        <h1 className="mb-8 font-heading text-3xl font-bold text-foreground">
          Danh sách học viên
        </h1>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'pending' | 'active')}
          items={[
            {
              key: 'pending',
              label: `Chờ duyệt (${pendingList.length})`,
              children: isLoadingPending ? (
                <div className="flex justify-center py-10">
                  <Spin />
                </div>
              ) : pendingList.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  Không có yêu cầu nào đang chờ duyệt.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {pendingList.map((trainee) => (
                    <TraineeCard
                      key={trainee.id}
                      trainee={trainee}
                      mode="pending"
                      onApprove={approveRequest}
                      onReject={rejectRequest}
                    />
                  ))}
                </div>
              ),
            },
            {
              key: 'active',
              label: `Đang hoạt động (${activeList.length})`,
              children: isLoadingActive ? (
                <div className="flex justify-center py-10">
                  <Spin />
                </div>
              ) : activeList.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">
                  Chưa có học viên nào.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {activeList.map((trainee) => (
                    <TraineeCard
                      key={trainee.id}
                      trainee={trainee}
                      mode="active"
                    />
                  ))}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
