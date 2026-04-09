'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, DatePicker, Form, Input, InputNumber, Modal, Result, Select, Spin, message } from 'antd';
import {
  AimOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ColumnHeightOutlined,
  PhoneOutlined,
  PieChartOutlined,
  StockOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import {
  getCheckInHistory,
  getProfile,
  getPTTrainingHistory,
  updateProfile,
} from '@/app/services/api';
import type {
  CheckInHistoryItem,
  CheckInHistoryResponse,
  Profile,
  ProfileResponse,
  PTTrainingHistoriesResponse,
  PTTrainingHistory,
  UpdateProfileRequest,
} from '@/app/types/types';
import { useAuthStore } from '@/app/stores/authStore';

function BentoCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function normalizeDateKey(key: string): string {
  const slice = key.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(slice)) return slice;
  return dayjs(key).format('YYYY-MM-DD');
}

function totalCheckInsFromGrouped(
  raw: Record<string, CheckInHistoryItem[]>,
): number {
  let n = 0;
  for (const items of Object.values(raw)) {
    n += items.length;
  }
  return n;
}

function computeCheckInStreak(
  raw: Record<string, CheckInHistoryItem[]>,
): number {
  const keys = Object.keys(raw).map(normalizeDateKey);
  if (keys.length === 0) return 0;
  const set = new Set(keys);

  let start = dayjs().startOf('day');
  if (!set.has(start.format('YYYY-MM-DD'))) {
    start = start.subtract(1, 'day');
  }
  if (!set.has(start.format('YYYY-MM-DD'))) {
    return 0;
  }

  let streak = 0;
  let d = start;
  while (set.has(d.format('YYYY-MM-DD'))) {
    streak += 1;
    d = d.subtract(1, 'day');
  }
  return streak;
}

function bmiLabel(bmi: number): string {
  if (bmi < 18.5) return 'Thiếu cân';
  if (bmi < 25) return 'Bình thường';
  if (bmi < 30) return 'Thừa cân';
  return 'Béo phì';
}

function fitnessGoalLabel(goal: string | null): string | null {
  if (!goal) return null;
  const map: Record<string, string> = {
    LOSE_WEIGHT: 'Giảm cân',
    GAIN_MUSCLE: 'Tăng cơ',
    IMPROVE_HEALTH: 'Cải thiện sức khỏe',
    MAINTAIN_WEIGHT: 'Duy trì cân nặng',
  };
  return map[goal] ?? goal;
}

function genderLabel(g: string | null): string | null {
  if (!g) return null;
  if (g === 'MALE') return 'Nam';
  if (g === 'FEMALE') return 'Nữ';
  return g;
}

function renderUpdating(value: unknown, formatter?: (v: any) => React.ReactNode) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-neutral-400">Đang cập nhật</span>;
  }
  return formatter ? formatter(value) : (value as any);
}

function cleanUpdatePayload(values: any): UpdateProfileRequest {
  const payload: UpdateProfileRequest = {};

  if (typeof values.name === 'string' && values.name.trim()) payload.name = values.name.trim();
  if (values.gender) payload.gender = values.gender;
  if (typeof values.phone === 'string' && values.phone.trim()) payload.phone = values.phone.trim();
  if (values.dateOfBirth) payload.dateOfBirth = dayjs(values.dateOfBirth).toISOString();
  if (typeof values.avatar === 'string' && values.avatar.trim()) payload.avatar = values.avatar.trim();
  if (typeof values.height === 'number') payload.height = values.height;
  if (typeof values.weight === 'number') payload.weight = values.weight;
  if (values.fitnessGoal) payload.fitnessGoal = values.fitnessGoal;

  return payload;
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, loading: authLoading, user } = useAuthStore();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm] = Form.useForm();

  const { mutate: submitUpdate, isPending: isUpdating } = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => updateProfile(payload),
    onSuccess: () => {
      message.success('Đã cập nhật hồ sơ');
      queryClient.invalidateQueries({ queryKey: ['account-profile'] });
      setEditOpen(false);
    },
    onError: () => {
      message.error('Cập nhật thất bại. Vui lòng thử lại.');
    },
  });

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, router]);

  const {
    data: profileRes,
    isLoading: profileLoading,
    isError: profileError,
  } = useQuery<ProfileResponse>({
    queryKey: ['account-profile'],
    queryFn: () => getProfile(),
    enabled: isLoggedIn,
  });

  const { data: checkInRes } = useQuery<CheckInHistoryResponse>({
    queryKey: ['profile-checkins'],
    queryFn: () => getCheckInHistory(),
    enabled: isLoggedIn,
  });

  const { data: ptHistoryRes } = useQuery<PTTrainingHistoriesResponse>({
    queryKey: ['profile-pt-history'],
    queryFn: () => getPTTrainingHistory(),
    enabled: isLoggedIn && user?.role === 'USER',
  });

  const profile: Profile | undefined = profileRes?.data;

  const checkInGrouped = checkInRes?.data ?? {};
  const totalCheckIns = useMemo(
    () => totalCheckInsFromGrouped(checkInGrouped),
    [checkInGrouped],
  );
  const checkInStreak = useMemo(
    () => computeCheckInStreak(checkInGrouped),
    [checkInGrouped],
  );

  const ptSessions: PTTrainingHistory[] = useMemo(() => {
    const list = ptHistoryRes?.data ?? [];
    return [...list].sort(
      (a, b) =>
        dayjs(b.startTime).valueOf() - dayjs(a.startTime).valueOf(),
    );
  }, [ptHistoryRes?.data]);

  const ptAcceptedCount = useMemo(
    () => ptSessions.filter((s) => s.status === 'ACCEPTED').length,
    [ptSessions],
  );

  const recentPt = useMemo(() => ptSessions.slice(0, 5), [ptSessions]);

  const displayName =
    profile?.name?.trim() || profile?.email?.split('@')[0] || 'Thành viên';

  const initials = useMemo(() => {
    const n = profile?.name?.trim();
    if (n) {
      const parts = n.split(/\s+/).filter(Boolean);
      const s =
        parts.length >= 2
          ? `${parts[0][0]}${parts[parts.length - 1][0]}`
          : parts[0]?.slice(0, 2) ?? '';
      return s.toUpperCase();
    }
    return profile?.email?.slice(0, 2).toUpperCase() ?? '?';
  }, [profile?.name, profile?.email]);

  const bmi =
    profile?.height != null &&
    profile?.weight != null &&
    profile.height > 0
      ? profile.weight / Math.pow(profile.height / 100, 2)
      : null;

  const hasBmi = bmi != null && Number.isFinite(bmi);

  if (!isLoggedIn && !authLoading) {
    return (
      <Result
        status="warning"
        title="Vui lòng đăng nhập để xem hồ sơ"
      />
    );
  }

  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Result
          status="error"
          title="Không tải được hồ sơ"
          subTitle="Vui lòng thử lại sau."
        />
      </div>
    );
  }

  const goalText = fitnessGoalLabel(profile.fitnessGoal);
  const showMemberSince = Boolean(profile.createdAt);

  const openEditModal = () => {
    if (!profile) return;
    editForm.setFieldsValue({
      name: profile.name ?? '',
      gender: profile.gender ?? undefined,
      phone: profile.phone ?? '',
      dateOfBirth: profile.dateOfBirth ? dayjs(profile.dateOfBirth) : undefined,
      avatar: profile.avatar ?? '',
      height: profile.height ?? undefined,
      weight: profile.weight ?? undefined,
      fitnessGoal: profile.fitnessGoal ?? undefined,
    });
    setEditOpen(true);
  };

  const onSubmitEdit = async () => {
    try {
      const values = await editForm.validateFields();
      const payload = cleanUpdatePayload(values);
      submitUpdate(payload);
    } catch {
      // validation error
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 pt-10">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="text-sm text-neutral-500 transition-colors hover:text-neutral-800"
            >
              ← Quay lại
            </button>
            <h1 className="text-3xl font-bold text-neutral-900">Hồ sơ của tôi</h1>
          </div>

          <Button type="primary" className="bg-black!" onClick={openEditModal}>
            Cập nhật hồ sơ
          </Button>
        </div>

        <div className="grid auto-rows-auto grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <BentoCard className="flex items-center gap-5 md:col-span-2">
            <Avatar
              size={80}
              src={profile.avatar || undefined}
              icon={!profile.avatar ? <UserOutlined /> : undefined}
              className="shrink-0 border-2 border-neutral-900"
            >
              {!profile.avatar ? initials : null}
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-neutral-900">
                {displayName}
              </h2>
              <p className="truncate text-sm text-neutral-500">
                {profile.email}
              </p>
              {showMemberSince ? (
                <div className="mt-2">
                  <span className="rounded-full bg-neutral-100 px-3 py-0.5 text-xs font-medium text-neutral-800">
                    Thành viên từ{' '}
                    {dayjs(profile.createdAt).format('DD/MM/YYYY')}
                  </span>
                </div>
              ) : null}
            </div>
          </BentoCard>

          <BentoCard className="flex flex-col items-center justify-center text-center">
            <ThunderboltOutlined className="mb-2 text-3xl text-neutral-900" />
            <span className="text-3xl font-bold text-neutral-900">
              {user?.role === 'USER' ? ptAcceptedCount : 0}
            </span>
            <span className="text-xs text-neutral-500">
              Buổi tập với PT (đã xác nhận)
            </span>
            {user?.role !== 'USER' ? (
              <span className="mt-1 text-xs text-neutral-400">Đang cập nhật</span>
            ) : null}
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <div className="mb-3 flex items-center gap-2">
              <CalendarOutlined className="text-neutral-900" />
              <span className="text-sm font-semibold text-neutral-900">
                Check-in tại phòng
              </span>
            </div>
            <p className="text-sm text-neutral-700">
              Tổng{' '}
              <span className="font-semibold text-neutral-900">
                {totalCheckIns}
              </span>{' '}
              lượt
            </p>
            <p className="mt-2 text-sm text-neutral-700">
              Chuỗi hiện tại:{' '}
              <span className="font-semibold text-neutral-900">
                {checkInStreak}
              </span>{' '}
              ngày liên tiếp có check-in
            </p>
            {totalCheckIns === 0 ? (
              <p className="mt-2 text-sm text-neutral-400">Đang cập nhật</p>
            ) : null}
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <ColumnHeightOutlined className="text-lg text-neutral-800" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Chiều cao</p>
                <p className="text-xl font-bold text-neutral-900">
                  {renderUpdating(profile.height, (v) => (
                    <>
                      {v}{' '}
                      <span className="text-sm font-normal text-neutral-500">
                        cm
                      </span>
                    </>
                  ))}
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <StockOutlined className="text-lg text-neutral-800" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Cân nặng</p>
                <p className="text-xl font-bold text-neutral-900">
                  {renderUpdating(profile.weight, (v) => (
                    <>
                      {v}{' '}
                      <span className="text-sm font-normal text-neutral-500">
                        kg
                      </span>
                    </>
                  ))}
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <PieChartOutlined className="text-lg text-neutral-800" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">BMI</p>
                {hasBmi ? (
                  <>
                    <p className="text-xl font-bold text-neutral-900">
                      {bmi!.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-neutral-600">
                      {bmiLabel(bmi!)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-neutral-400">
                    Đang cập nhật
                  </p>
                )}
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <PhoneOutlined className="text-lg text-neutral-800" />
              <div>
                <p className="text-xs text-neutral-500">Điện thoại</p>
                <p className="text-sm font-medium text-neutral-900">
                  {renderUpdating(profile.phone?.trim())}
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <UserOutlined className="text-lg text-neutral-800" />
              <div>
                <p className="text-xs text-neutral-500">Giới tính</p>
                <p className="text-sm font-medium text-neutral-900">
                  {renderUpdating(genderLabel(profile.gender))}
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <div className="flex items-center gap-3">
              <CalendarOutlined className="text-lg text-neutral-800" />
              <div>
                <p className="text-xs text-neutral-500">Ngày sinh</p>
                <p className="text-sm font-medium text-neutral-900">
                  {profile.dateOfBirth
                    ? dayjs(profile.dateOfBirth).format('DD/MM/YYYY')
                    : renderUpdating(null)}
                </p>
              </div>
            </div>
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <div className="mb-2 flex items-center gap-2">
              <AimOutlined className="text-neutral-900" />
              <span className="text-sm font-semibold text-neutral-900">
                Mục tiêu luyện tập
              </span>
            </div>
            <p className="text-sm text-neutral-700">
              {renderUpdating(goalText)}
            </p>
          </BentoCard>

          <BentoCard className="md:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <ClockCircleOutlined className="text-neutral-900" />
              <span className="text-sm font-semibold text-neutral-900">
                Buổi tập với PT gần đây
              </span>
            </div>
            {user?.role !== 'USER' ? (
              <p className="text-sm text-neutral-400">Đang cập nhật</p>
            ) : recentPt.length === 0 ? (
              <p className="text-sm text-neutral-400">Đang cập nhật</p>
            ) : (
              <div className="space-y-3">
                {recentPt.map((w) => (
                  <div
                    key={w.id}
                    className="flex flex-col gap-1 rounded-xl bg-neutral-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {w.userPackage.package.name}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {dayjs(w.startTime).format('DD/MM/YYYY HH:mm')} ·{' '}
                        {w.branch.name}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium capitalize text-neutral-600">
                      {w.status === 'ACCEPTED'
                        ? 'Đã xác nhận'
                        : w.status === 'REJECTED'
                          ? 'Từ chối'
                          : w.status === 'PENDING'
                            ? 'Chờ xác nhận'
                            : w.status === 'CANCELLED'
                              ? 'Đã hủy'
                              : w.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>
        </div>
      </div>

      <Modal
        title="Cập nhật thông tin hồ sơ"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={onSubmitEdit}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={isUpdating}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" className="mt-3">
          <Form.Item name="name" label="Họ và tên">
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item name="gender" label="Giới tính">
            <Select
              allowClear
              options={[
                { value: 'MALE', label: 'Nam' },
                { value: 'FEMALE', label: 'Nữ' },
              ]}
            />
          </Form.Item>

          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="09xxxxxxxx" />
          </Form.Item>

          <Form.Item name="dateOfBirth" label="Ngày sinh">
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="avatar" label="Avatar URL">
            <Input placeholder="https://..." />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item name="height" label="Chiều cao (cm)">
              <InputNumber className="w-full" min={0} max={300} />
            </Form.Item>
            <Form.Item name="weight" label="Cân nặng (kg)">
              <InputNumber className="w-full" min={0} max={1000} />
            </Form.Item>
          </div>

          <Form.Item name="fitnessGoal" label="Mục tiêu">
            <Select
              allowClear
              options={[
                { value: 'LOSE_WEIGHT', label: 'Giảm cân' },
                { value: 'GAIN_MUSCLE', label: 'Tăng cơ' },
                { value: 'IMPROVE_HEALTH', label: 'Cải thiện sức khỏe' },
                { value: 'MAINTAIN_WEIGHT', label: 'Duy trì cân nặng' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
