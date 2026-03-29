'use client';

import { useMemo, useState } from 'react';
import { Calendar, Spin, Typography } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import viCalendar from 'antd/es/calendar/locale/vi_VN';

dayjs.locale('vi');
import { useQuery } from '@tanstack/react-query';
import { CheckCircleOutlined } from '@ant-design/icons';

import { getCheckInHistory } from '@/app/services/api';
import type {
  CheckInHistoryItem,
  CheckInHistoryResponse,
} from '@/app/types/types';

const { Title, Text } = Typography;

function normalizeDateKey(key: string): string {
  const slice = key.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(slice)) return slice;
  return dayjs(key).format('YYYY-MM-DD');
}

function formatCheckInTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function MySchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs());

  const { data, isLoading, isError } = useQuery<CheckInHistoryResponse>({
    queryKey: ['check-in-history'],
    queryFn: () => getCheckInHistory(),
  });

  const checkInMap = useMemo(() => {
    const raw = data?.data ?? {};
    const map = new Map<string, CheckInHistoryItem[]>();
    for (const [k, items] of Object.entries(raw)) {
      const key = normalizeDateKey(k);
      const prev = map.get(key) ?? [];
      map.set(key, [...prev, ...items]);
    }
    return map;
  }, [data]);

  const checkInDateSet = useMemo(
    () => new Set(checkInMap.keys()),
    [checkInMap],
  );

  const selectedKey = selectedDate.format('YYYY-MM-DD');
  const selectedItems = checkInMap.get(selectedKey) ?? [];

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 pt-8 md:pt-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="mb-8">
          <Title level={2} className="mb-2! text-neutral-900!">
            Lịch tập & check-in
          </Title>
          <Text type="secondary" className="text-base">
            Xem các ngày bạn đã check-in tại phòng gym.
          </Text>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-sm border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          <CheckCircleOutlined className="text-lg" />
          <span>
            Ngày có nhãn <strong>Đã check-in</strong> là ngày bạn có ít nhất một
            lần check-in.
          </span>
        </div>

        {isError ? (
          <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            Không tải được lịch sử check-in. Vui lòng thử lại sau.
          </div>
        ) : null}

        <div className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-24">
              <Spin size="large" />
            </div>
          ) : (
            <Calendar
              value={selectedDate}
              onSelect={(d) => setSelectedDate(d)}
              locale={viCalendar}
              fullscreen={false}
              className="my-schedule-calendar p-2 sm:p-4"
              cellRender={(date, info) => {
                if (info.type !== 'date') return info.originNode;
                const key = date.format('YYYY-MM-DD');
                const hasCheckIn = checkInDateSet.has(key);
                return (
                  <div className="flex min-h-17 flex-col gap-1 py-0.5">
                    <span className="text-sm font-medium leading-none text-neutral-900">
                      {date.date()}
                    </span>
                    {hasCheckIn ? (
                      <span className="inline-flex items-center justify-center rounded-sm bg-emerald-100 px-1.5 py-1 text-center text-[10px] font-semibold leading-tight text-emerald-800">
                        Đã check-in
                      </span>
                    ) : null}
                  </div>
                );
              }}
            />
          )}
        </div>

        <div className="mt-8 rounded-sm border border-neutral-200 bg-white p-5 shadow-sm">
          <Title level={5} className="mb-3! mt-0! text-neutral-900!">
            Chi tiết ngày {selectedDate.format('DD/MM/YYYY')}
          </Title>
          {selectedItems.length === 0 ? (
            <Text type="secondary">
              Chưa có lượt check-in nào trong ngày này.
            </Text>
          ) : (
            <ul className="space-y-3">
              {selectedItems.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-1 rounded-sm border border-neutral-100 bg-neutral-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-neutral-900">
                    {item.branch.name}
                  </span>
                  <span className="text-sm text-neutral-600">
                    {formatCheckInTime(item.checkedInAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
