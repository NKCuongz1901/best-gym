'use client';

import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import viLocale from '@fullcalendar/core/locales/vi';
import type { DatesSetArg, EventContentArg, EventInput } from '@fullcalendar/core';
import { useQuery } from '@tanstack/react-query';
import { Spin } from 'antd';
import dayjs from 'dayjs';

import { getPTAssistSchedule } from '@/app/services/api';
import type {
  FILTER_PT_ASSIST_SCHEDULE_PROPS,
} from '@/app/types/filters';
import type { PTAssistSchedule, PTAssistSchedulesResponse } from '@/app/types/types';
import { useAuthStore } from '@/app/stores/authStore';

function renderEventContent(arg: EventContentArg) {
  const status = (arg.event.extendedProps.status as string | undefined) ?? 'ACCEPTED';
  const trainee = (arg.event.extendedProps.traineeName as string | undefined) ?? 'Không rõ học viên';
  const packageName = (arg.event.extendedProps.packageName as string | undefined) ?? '';
  const colorClass =
    status === 'REJECTED'
      ? 'bg-red-500/90'
      : status === 'ACCEPTED'
        ? 'bg-violet-600/90'
        : 'bg-sky-500/90';

  return (
    <div className={`w-full rounded px-1.5 py-1 text-[11px] leading-tight text-white ${colorClass}`}>
      <div className="font-semibold">{arg.timeText}</div>
      <div className="font-semibold">{trainee}</div>
      {packageName ? <div className="opacity-90">{packageName}</div> : null}
    </div>
  );
}

export default function PTSchedulePage() {
  const { isLoggedIn, user } = useAuthStore();
  const [range, setRange] = useState<FILTER_PT_ASSIST_SCHEDULE_PROPS>(() => {
    const start = dayjs().startOf('week').add(1, 'day');
    const end = start.add(6, 'day').endOf('day');
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  });

  const { data, isLoading, isError } = useQuery<PTAssistSchedulesResponse>({
    queryKey: ['pt-assist-schedule', range.from, range.to],
    queryFn: () => getPTAssistSchedule(range),
    enabled: isLoggedIn && user?.role === 'PT',
  });

  const events = useMemo<EventInput[]>(() => {
    const schedules: PTAssistSchedule[] = data?.data ?? [];
    return schedules.map((item) => {
      const traineeName = item.extendedProps.account.profile?.name ?? item.extendedProps.account.email;
      return {
        id: item.id,
        title: item.title,
        start: item.start,
        end: item.end,
        allDay: item.allDay,
        extendedProps: {
          status: item.extendedProps.status,
          traineeName,
          packageName: item.extendedProps.userPackage.package.name,
        },
      };
    });
  }, [data]);

  const handleDatesSet = (arg: DatesSetArg) => {
    setRange({
      from: arg.start.toISOString(),
      to: arg.end.toISOString(),
    });
  };

  return (
    <div className="min-h-screen bg-neutral-950 px-4 pb-12 pt-8 text-white">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-5">
          <h1 className="text-2xl font-bold">Lịch dạy PT</h1>
          <p className="mt-1 text-sm text-neutral-300">
            Theo dõi lịch hỗ trợ theo tuần và khung giờ chi tiết.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 p-3">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <Spin />
            </div>
          ) : (
            <div className="pt-schedule-calendar">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin]}
                locale={viLocale}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'timeGridWeek,dayGridMonth',
                }}
                events={events}
                datesSet={handleDatesSet}
                allDaySlot
                slotMinTime="06:00:00"
                slotMaxTime="22:00:00"
                nowIndicator
                height="auto"
                eventContent={renderEventContent}
              />
            </div>
          )}
          <style jsx global>{`
            .pt-schedule-calendar .fc {
              --fc-page-bg-color: #0a0a0a;
              --fc-neutral-bg-color: #111214;
              --fc-border-color: #2a2a2a;
              --fc-neutral-text-color: #f5f5f5;
              --fc-today-bg-color: rgba(250, 204, 21, 0.16);
            }
            .pt-schedule-calendar .fc .fc-col-header-cell {
              background: #171717;
            }
            .pt-schedule-calendar .fc .fc-col-header-cell-cushion {
              color: #fafafa;
              font-weight: 700;
              padding: 8px 4px;
            }
            .pt-schedule-calendar .fc .fc-timegrid-axis-cushion,
            .pt-schedule-calendar .fc .fc-timegrid-slot-label-cushion {
              color: #e5e5e5;
            }
            .pt-schedule-calendar .fc .fc-toolbar-title {
              color: #fafafa;
              font-size: 1.05rem;
              font-weight: 700;
            }
            .pt-schedule-calendar .fc .fc-button {
              border-color: #3f3f46;
              background: #18181b;
              color: #fafafa;
            }
            .pt-schedule-calendar .fc .fc-button:hover {
              background: #27272a;
            }
          `}</style>
          {isError ? (
            <p className="px-3 pb-2 pt-3 text-sm text-red-300">
              Không tải được lịch dạy. Vui lòng thử lại.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
