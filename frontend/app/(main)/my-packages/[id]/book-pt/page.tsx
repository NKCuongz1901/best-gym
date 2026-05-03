'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Result,
  Spin,
  Tag,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';

import {
  createPtAssistRequest,
  getAvailablePTs,
  getMyPurchasePackages,
} from '@/app/services/api';
import type {
  AvailablePtAccount,
  AvailablePtShiftSchedule,
  CreatePtAssistRequestRequest,
  MyPurchasePackage,
  MyPurchasePackagesResponse,
} from '@/app/types/types';
import { useAuthStore } from '@/app/stores/authStore';
import SelectPtStep from '@/app/components/purchase/SelectPtStep';

const shiftLabels: Record<'MORNING' | 'AFTERNOON' | 'EVENING', string> = {
  MORNING: 'Ca sáng',
  AFTERNOON: 'Ca chiều',
  EVENING: 'Ca tối',
};

export default function BookPtSessionPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { isLoggedIn, loading: authLoading } = useAuthStore();
  const userPackageId = params?.id;

  const [selectedPtId, setSelectedPtId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<dayjs.Dayjs | null>(null);
  const [note, setNote] = useState<string>('');
  const [ptSearch, setPtSearch] = useState('');
  const [ptShiftType, setPtShiftType] = useState<
    'MORNING' | 'AFTERNOON' | 'EVENING' | undefined
  >(undefined);
  const [ptFromDate, setPtFromDate] = useState<string | undefined>(undefined);
  const [ptToDate, setPtToDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/');
    }
  }, [authLoading, isLoggedIn, router]);

  const { data: myPkgRes, isLoading: isLoadingMyPkg } =
    useQuery<MyPurchasePackagesResponse>({
      queryKey: ['my-packages'],
      queryFn: () => getMyPurchasePackages(),
      enabled: isLoggedIn,
    });

  const userPackage: MyPurchasePackage | null = useMemo(() => {
    const list = myPkgRes?.data ?? [];
    return list.find((p) => p.id === userPackageId) ?? null;
  }, [myPkgRes?.data, userPackageId]);

  const branchId = userPackage?.branchId;

  const { data: ptsRes, isLoading: isLoadingPts } = useQuery({
    queryKey: [
      'available-pts-book',
      branchId,
      ptShiftType,
      ptFromDate,
      ptToDate,
      ptSearch,
    ],
    queryFn: () =>
      getAvailablePTs({
        branchId: branchId as string,
        shiftType: ptShiftType,
        from: ptFromDate,
        to: ptToDate,
        search: ptSearch || undefined,
      }),
    enabled: isLoggedIn && !!branchId,
  });

  const pts: AvailablePtAccount[] = ptsRes?.data ?? [];

  const selectedPt = useMemo(
    () => pts.find((pt) => pt.id === selectedPtId) ?? null,
    [pts, selectedPtId],
  );

  const selectedSlot: AvailablePtShiftSchedule | null = useMemo(() => {
    if (!selectedPt || !selectedSlotId) return null;
    return (
      selectedPt.ptShiftSchedules.find((s) => s.id === selectedSlotId) ?? null
    );
  }, [selectedPt, selectedSlotId]);

  useEffect(() => {
    setSelectedSlotId(null);
    setSessionDate(null);
  }, [selectedPtId]);

  useEffect(() => {
    setSessionDate(null);
  }, [selectedSlotId]);

  const { mutate: submitBooking, isPending: isSubmitting } = useMutation({
    mutationFn: (payload: CreatePtAssistRequestRequest) =>
      createPtAssistRequest(payload),
    onSuccess: () => {
      message.success('Đã gửi yêu cầu đặt buổi PT');
      router.push('/my-packages');
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Không thể đặt buổi. Vui lòng thử lại.';
      message.error(typeof msg === 'string' ? msg : 'Đặt buổi thất bại');
    },
  });

  const remaining =
    typeof userPackage?.ptSessionsRemaining === 'number'
      ? userPackage.ptSessionsRemaining
      : null;

  const granted =
    userPackage?.ptSessionsGranted ??
    userPackage?.package?.ptSessionsIncluded ??
    0;

  const outOfQuota = remaining !== null && remaining <= 0;

  const disabledDate = (current: dayjs.Dayjs) => {
    if (!selectedSlot || !current) return true;
    const slotFrom = dayjs(selectedSlot.fromDate).startOf('day');
    const slotTo = dayjs(selectedSlot.toDate).startOf('day');
    if (current.isBefore(slotFrom, 'day') || current.isAfter(slotTo, 'day')) {
      return true;
    }
    if (userPackage?.startAt) {
      const pkgStart = dayjs(userPackage.startAt).startOf('day');
      if (current.isBefore(pkgStart, 'day')) return true;
    }
    if (userPackage?.endAt) {
      const pkgEnd = dayjs(userPackage.endAt).startOf('day');
      if (current.isAfter(pkgEnd, 'day')) return true;
    }
    if (current.isBefore(dayjs().startOf('day'), 'day')) return true;
    return false;
  };

  const canSubmit =
    !!userPackageId &&
    !!selectedSlotId &&
    !!sessionDate &&
    !outOfQuota &&
    userPackage?.status === 'ACTIVE';

  const handleSubmit = () => {
    if (!canSubmit || !sessionDate || !selectedSlotId || !userPackageId) return;
    submitBooking({
      userPackageId,
      slotId: selectedSlotId,
      sessionDate: sessionDate.format('YYYY-MM-DD'),
      note: note.trim() || undefined,
    });
  };

  if (authLoading || isLoadingMyPkg) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!userPackage) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Result
          status="404"
          title="Không tìm thấy gói tập"
          subTitle="Gói tập có thể đã bị xoá hoặc không thuộc về bạn."
          extra={
            <Button type="primary" onClick={() => router.push('/my-packages')}>
              Về Gói tập của tôi
            </Button>
          }
        />
      </div>
    );
  }

  if (!userPackage.package.hasPt) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Result
          status="warning"
          title="Gói này không bao gồm PT"
          extra={
            <Button type="primary" onClick={() => router.push('/my-packages')}>
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24 pt-10">
      <div className="mx-auto w-full max-w-5xl px-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
        >
          ← Quay lại
        </button>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Đặt buổi tập với PT
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Gói {userPackage.package.name} · Chi nhánh{' '}
              {userPackage.branch.name}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm">
            Buổi PT còn lại:{' '}
            <span className="font-semibold text-neutral-900">
              {remaining ?? '—'}
            </span>{' '}
            / <span className="font-semibold">{granted || '—'}</span>
          </div>
        </div>

        {outOfQuota ? (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message="Bạn đã hết số buổi PT của gói này."
            description="Hãy đợi PT từ chối/hủy các buổi PENDING hoặc đăng ký gói mới."
          />
        ) : null}

        {userPackage.status !== 'ACTIVE' ? (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message="Gói tập chưa kích hoạt"
            description="Bạn chỉ có thể đặt buổi PT khi gói đang ở trạng thái ACTIVE."
          />
        ) : null}

        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <SelectPtStep
            loading={isLoadingPts}
            pts={pts}
            selectedPtId={selectedPtId}
            onSelect={(pt) => setSelectedPtId(pt.id)}
            search={ptSearch}
            shiftType={ptShiftType}
            fromDate={ptFromDate}
            toDate={ptToDate}
            onSearchChange={(v) => setPtSearch(v)}
            onShiftTypeChange={(v) => setPtShiftType(v)}
            onDateRangeChange={(from, to) => {
              setPtFromDate(from);
              setPtToDate(to);
            }}
          />
        </div>

        {selectedPt ? (
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Chọn ca dạy của {selectedPt.profile?.name || selectedPt.email}
            </h2>
            {selectedPt.ptShiftSchedules.length === 0 ? (
              <p className="text-sm text-neutral-500">
                PT này hiện chưa có ca dạy phù hợp với điều kiện lọc.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {selectedPt.ptShiftSchedules.map((slot) => {
                  const isActive = selectedSlotId === slot.id;
                  return (
                    <button
                      type="button"
                      key={slot.id}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        isActive
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-md'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Tag
                          color={isActive ? 'white' : 'blue'}
                          className="m-0!"
                        >
                          {shiftLabels[slot.shiftTemplate.type]}
                        </Tag>
                        <span
                          className={`text-sm font-medium ${
                            isActive ? 'text-white' : 'text-neutral-900'
                          }`}
                        >
                          <ClockCircleOutlined className="mr-1" />
                          {slot.shiftTemplate.startTime} -{' '}
                          {slot.shiftTemplate.endTime}
                        </span>
                      </div>
                      <p
                        className={`mt-2 text-xs ${
                          isActive ? 'text-neutral-200' : 'text-neutral-500'
                        }`}
                      >
                        <CalendarOutlined className="mr-1" />
                        {dayjs(slot.fromDate).format('DD/MM/YYYY')} →{' '}
                        {dayjs(slot.toDate).format('DD/MM/YYYY')}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          isActive ? 'text-neutral-200' : 'text-neutral-500'
                        }`}
                      >
                        Tối đa {slot.maxStudents} học viên / ca
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {selectedSlot ? (
          <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold text-neutral-900">
              Thông tin buổi tập
            </h2>
            <Form layout="vertical" className="grid gap-4 md:grid-cols-2">
              <Form.Item label="Ngày tập" required className="mb-0">
                <DatePicker
                  className="w-full"
                  format="DD/MM/YYYY"
                  value={sessionDate}
                  onChange={(value) => setSessionDate(value)}
                  disabledDate={disabledDate}
                />
              </Form.Item>
              <Form.Item label="Khung giờ" className="mb-0">
                <Input
                  readOnly
                  value={`${selectedSlot.shiftTemplate.startTime} - ${selectedSlot.shiftTemplate.endTime}`}
                />
              </Form.Item>
              <Form.Item label="Ghi chú" className="mb-0 md:col-span-2">
                <Input.TextArea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Mong muốn của bạn cho buổi tập (tuỳ chọn)"
                />
              </Form.Item>
            </Form>
          </div>
        ) : null}

        <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white/90 py-3 backdrop-blur">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4">
            <Button onClick={() => router.back()}>Hủy</Button>
            <Button
              type="primary"
              loading={isSubmitting}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Gửi yêu cầu đặt buổi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
