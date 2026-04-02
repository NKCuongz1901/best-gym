'use client';

import { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import viLocale from '@fullcalendar/core/locales/vi';
import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  Tag,
  message,
} from 'antd';
import dayjs from 'dayjs';

import { getPTAssistSchedule, reportUserSession } from '@/app/services/api';
import type {
  FILTER_PT_ASSIST_SCHEDULE_PROPS,
} from '@/app/types/filters';
import type {
  PTAssistSchedule,
  PTAssistSchedulesResponse,
  ReportUserSessionRequest,
} from '@/app/types/types';
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
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuthStore();
  const [detailOpen, setDetailOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PTAssistSchedule | null>(
    null,
  );
  const [feedbackForm] = Form.useForm<ReportUserSessionRequest>();

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

  const scheduleById = useMemo(() => {
    const list = data?.data ?? [];
    return new Map(list.map((s) => [s.id, s]));
  }, [data?.data]);

  const { mutate: submitSessionReport, isPending: isSubmittingReport } =
    useMutation({
      mutationFn: (payload: ReportUserSessionRequest) =>
        reportUserSession(payload),
      onSuccess: () => {
        message.success('Đã gửi nhận xét buổi tập');
        queryClient.invalidateQueries({ queryKey: ['pt-assist-schedule'] });
        setFeedbackOpen(false);
        feedbackForm.resetFields();
      },
      onError: () => {
        message.error('Không thể gửi nhận xét. Vui lòng thử lại.');
      },
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

  const handleEventClick = (info: EventClickArg) => {
    const schedule = scheduleById.get(info.event.id);
    if (schedule) {
      setSelectedSchedule(schedule);
      setDetailOpen(true);
    }
  };

  const openFeedbackModal = () => {
    feedbackForm.setFieldsValue({
      ptAssistRequestId: selectedSchedule?.id ?? '',
      completion: 'COMPLETED',
      summary: '',
      techniqueNote: '',
      improvement: '',
      nextSessionPlan: '',
      weightKg: undefined,
      bodyNote: '',
    });
    setFeedbackOpen(true);
  };

  const handleSubmitFeedback = async () => {
    try {
      const values = await feedbackForm.validateFields();
      if (!selectedSchedule) return;
      submitSessionReport({
        ...values,
        ptAssistRequestId: selectedSchedule.id,
        weightKg: Number(values.weightKg),
      });
    } catch {
      // validation failed
    }
  };

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
                eventClick={handleEventClick}
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
            .pt-schedule-calendar .fc .fc-event {
              cursor: pointer;
            }
          `}</style>
          {isError ? (
            <p className="px-3 pb-2 pt-3 text-sm text-red-300">
              Không tải được lịch dạy. Vui lòng thử lại.
            </p>
          ) : null}
        </div>
      </div>

      <Modal
        title="Chi tiết buổi tập"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setSelectedSchedule(null);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setDetailOpen(false);
              setSelectedSchedule(null);
            }}
          >
            Đóng
          </Button>,
          <Button key="feedback" type="primary" onClick={openFeedbackModal}>
            Nhận xét
          </Button>,
        ]}
        width={640}
        destroyOnClose
      >
        {selectedSchedule ? (
          <Descriptions bordered size="small" column={1}>
            <Descriptions.Item label="Tiêu đề">
              {selectedSchedule.title}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {dayjs(selectedSchedule.start).format('DD/MM/YYYY HH:mm')} —{' '}
              {dayjs(selectedSchedule.end).format('HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag
                color={
                  selectedSchedule.extendedProps.status === 'ACCEPTED'
                    ? 'green'
                    : 'red'
                }
              >
                {selectedSchedule.extendedProps.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Học viên">
              {selectedSchedule.extendedProps.account.profile?.name ??
                selectedSchedule.extendedProps.account.email}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedSchedule.extendedProps.account.email}
            </Descriptions.Item>
            <Descriptions.Item label="Chi nhánh">
              {selectedSchedule.extendedProps.branch.name}
            </Descriptions.Item>
            <Descriptions.Item label="Gói tập">
              {selectedSchedule.extendedProps.userPackage.package.name}
            </Descriptions.Item>
            {selectedSchedule.extendedProps.note ? (
              <Descriptions.Item label="Ghi chú">
                {selectedSchedule.extendedProps.note}
              </Descriptions.Item>
            ) : null}
            {selectedSchedule.extendedProps.rejectReason ? (
              <Descriptions.Item label="Lý do từ chối">
                {selectedSchedule.extendedProps.rejectReason}
              </Descriptions.Item>
            ) : null}
          </Descriptions>
        ) : null}
      </Modal>

      <Modal
        title="Nhận xét buổi tập"
        open={feedbackOpen}
        onOk={handleSubmitFeedback}
        onCancel={() => {
          setFeedbackOpen(false);
          feedbackForm.resetFields();
        }}
        confirmLoading={isSubmittingReport}
        okText="Gửi"
        cancelText="Hủy"
        width={560}
        destroyOnClose
      >
        <Form form={feedbackForm} layout="vertical" className="mt-2">
          <Form.Item
            name="completion"
            label="Hoàn thành buổi"
            rules={[{ required: true, message: 'Chọn trạng thái' }]}
          >
            <Select
              options={[
                { value: 'COMPLETED', label: 'Hoàn thành' },
                { value: 'INCOMPLETE', label: 'Chưa hoàn thành' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="summary"
            label="Tóm tắt buổi tập"
            rules={[{ required: true, message: 'Nhập tóm tắt' }]}
          >
            <Input.TextArea rows={3} placeholder="Tổng quan buổi tập..." />
          </Form.Item>
          <Form.Item
            name="techniqueNote"
            label="Kỹ thuật"
            rules={[{ required: true, message: 'Nhập nhận xét kỹ thuật' }]}
          >
            <Input.TextArea rows={2} placeholder="Điểm cần lưu ý về kỹ thuật..." />
          </Form.Item>
          <Form.Item
            name="improvement"
            label="Cần cải thiện"
            rules={[{ required: true, message: 'Nhập mục cải thiện' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="nextSessionPlan"
            label="Kế hoạch buổi sau"
            rules={[{ required: true, message: 'Nhập kế hoạch' }]}
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="weightKg"
            label="Cân nặng (kg)"
            rules={[{ required: true, message: 'Nhập cân nặng' }]}
          >
            <InputNumber min={0} step={0.1} className="w-full" placeholder="70" />
          </Form.Item>
          <Form.Item
            name="bodyNote"
            label="Ghi chú cơ thể"
            rules={[{ required: true, message: 'Nhập ghi chú' }]}
          >
            <Input.TextArea rows={2} placeholder="Tình trạng sức khỏe, đau nhức..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
