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
  DatePicker,
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
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import {
  acceptPTAssistRequest,
  createPTTrainingSlot,
  getBranches,
  getPTAssistRequests,
  getPTAssistSchedule,
  getPTShiftTemplates,
  getPTTrainingSlots,
  rejectPTAssistRequest,
  reportUserSession,
} from '@/app/services/api';
import type {
  FILTER_PT_ASSIST_SCHEDULE_PROPS,
} from '@/app/types/filters';
import type {
  Branch,
  CreatePTTrainingSlotRequest,
  PTAssistRequest,
  PTAssistSchedule,
  PTAssistSchedulesResponse,
  PTShiftTemplate,
  PTTrainingSlot,
  PTTrainingSlotsResponse,
  ReportUserSessionRequest,
} from '@/app/types/types';
import { useAuthStore } from '@/app/stores/authStore';

function toYyyyMmDd(iso?: string) {
  return iso ? dayjs(iso).format('YYYY-MM-DD') : undefined;
}

function pendingRequestToSchedule(req: PTAssistRequest): PTAssistSchedule {
  const name = req.account.profile?.name ?? req.account.email;
  return {
    id: req.id,
    title: `${name} - ${req.branch.name}`,
    start: req.startTime,
    end: req.endTime,
    allDay: false,
    extendedProps: {
      status: 'PENDING',
      note: req.note,
      rejectReason: req.rejectReason,
      account: req.account,
      branch: req.branch,
      userPackage: req.userPackage,
    },
  };
}

/** Buổi PENDING có start nằm trong khoảng lịch đang xem (overlap với [from, to]). */
function filterPendingInRange(
  requests: PTAssistRequest[],
  fromIso: string,
  toIso: string,
): PTAssistRequest[] {
  const fromMs = new Date(fromIso).getTime();
  const toMs = new Date(toIso).getTime();
  return requests.filter((r) => {
    if (r.status !== 'PENDING') return false;
    const start = new Date(r.startTime).getTime();
    const end = new Date(r.endTime).getTime();
    return start < toMs && end > fromMs;
  });
}

function renderEventContent(arg: EventContentArg) {
  const status = (arg.event.extendedProps.status as string | undefined) ?? 'ACCEPTED';
  const trainee = (arg.event.extendedProps.traineeName as string | undefined) ?? 'Không rõ học viên';
  const packageName = (arg.event.extendedProps.packageName as string | undefined) ?? '';
  const colorClass =
    status === 'REJECTED'
      ? 'bg-red-500/90'
      : status === 'PENDING'
        ? 'bg-amber-500/90'
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

type SetupSlotRow = {
  branchId: string;
  shiftTemplateId: string;
  fromDate: Dayjs;
  toDate: Dayjs;
  maxStudents: number;
};

function expandShiftSchedulesToBackgroundEvents(slots: PTTrainingSlot[]): EventInput[] {
  const events: EventInput[] = [];
  for (const slot of slots) {
    let cursor = dayjs(slot.fromDate).startOf('day');
    const end = dayjs(slot.toDate).startOf('day');
    while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
      const [sh, sm] = slot.shiftTemplate.startTime.split(':').map(Number);
      const [eh, em] = slot.shiftTemplate.endTime.split(':').map(Number);
      const start = cursor.hour(sh || 0).minute(sm || 0).second(0).millisecond(0);
      const finish = cursor.hour(eh || 0).minute(em || 0).second(0).millisecond(0);
      if (finish.isAfter(start)) {
        events.push({
          id: `pt-shift-${slot.id}-${cursor.format('YYYY-MM-DD')}`,
          start: start.toISOString(),
          end: finish.toISOString(),
          display: 'background',
          backgroundColor: 'rgba(34, 197, 94, 0.16)',
          classNames: ['pt-teaching-slot-bg'],
          extendedProps: { isTeachingSlot: true },
        });
      }
      cursor = cursor.add(1, 'day');
    }
  }
  return events;
}

export default function PTSchedulePage() {
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuthStore();
  const [detailOpen, setDetailOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [setupSlotsOpen, setSetupSlotsOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<PTAssistSchedule | null>(
    null,
  );
  const [feedbackForm] = Form.useForm<ReportUserSessionRequest>();
  const [setupSlotsForm] = Form.useForm<{ slot: SetupSlotRow }>();

  const [range, setRange] = useState<FILTER_PT_ASSIST_SCHEDULE_PROPS>(() => {
    const start = dayjs().startOf('week').add(1, 'day');
    const end = start.add(6, 'day').endOf('day');
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  });

  const {
    data: scheduleRes,
    isLoading: isLoadingSchedule,
    isError,
  } = useQuery<PTAssistSchedulesResponse>({
    queryKey: ['pt-assist-schedule', range.from, range.to],
    queryFn: () => getPTAssistSchedule(range),
    enabled: isLoggedIn && user?.role === 'PT',
  });

  const { data: assistRes, isLoading: isLoadingAssist } = useQuery({
    queryKey: ['pt-assist-requests'],
    queryFn: () => getPTAssistRequests(),
    enabled: isLoggedIn && user?.role === 'PT',
  });

  const mergedSchedules = useMemo(() => {
    const accepted: PTAssistSchedule[] = scheduleRes?.data ?? [];
    if (!range.from || !range.to) return accepted;
    const pendingRaw = assistRes?.data ?? [];
    const pendingInRange = filterPendingInRange(pendingRaw, range.from, range.to);
    const pendingAsSchedules = pendingInRange.map(pendingRequestToSchedule);
    return [...pendingAsSchedules, ...accepted];
  }, [scheduleRes?.data, assistRes?.data, range.from, range.to]);

  const scheduleById = useMemo(() => {
    return new Map(mergedSchedules.map((s) => [s.id, s]));
  }, [mergedSchedules]);

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

  const { mutate: acceptAssist, isPending: isAcceptingAssist } = useMutation({
    mutationFn: (id: string) => acceptPTAssistRequest(id),
    onSuccess: () => {
      message.success('Đã chấp nhận buổi hỗ trợ');
      queryClient.invalidateQueries({ queryKey: ['pt-assist-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-assist-requests'] });
      setDetailOpen(false);
      setSelectedSchedule(null);
    },
    onError: () => {
      message.error('Không thể chấp nhận. Vui lòng thử lại.');
    },
  });

  const { mutate: rejectAssist, isPending: isRejectingAssist } = useMutation({
    mutationFn: (id: string) => rejectPTAssistRequest(id),
    onSuccess: () => {
      message.info('Đã từ chối yêu cầu hỗ trợ');
      queryClient.invalidateQueries({ queryKey: ['pt-assist-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['pt-assist-requests'] });
      setDetailOpen(false);
      setSelectedSchedule(null);
    },
    onError: () => {
      message.error('Không thể từ chối. Vui lòng thử lại.');
    },
  });

  const {
    data: trainingSlotsRes,
    isLoading: isLoadingTrainingSlots,
    isError: isTrainingSlotsError,
  } = useQuery<PTTrainingSlotsResponse>({
    queryKey: ['pt-training-slots', range.from, range.to],
    queryFn: () =>
      getPTTrainingSlots({
        from: toYyyyMmDd(range.from),
        to: toYyyyMmDd(range.to),
      }),
    enabled: isLoggedIn && user?.role === 'PT',
  });

  const { data: branchesRes } = useQuery({
    queryKey: ['branches-for-pt-slot'],
    queryFn: () => getBranches({ page: 1, itemsPerPage: 100 }),
    enabled: setupSlotsOpen,
  });

  const { data: shiftTemplatesRes } = useQuery({
    queryKey: ['pt-shift-templates'],
    queryFn: () => getPTShiftTemplates(),
    enabled: setupSlotsOpen,
  });

  const { mutateAsync: submitTrainingSlot, isPending: isCreatingTrainingSlot } =
    useMutation({
      mutationFn: (payload: CreatePTTrainingSlotRequest) =>
        createPTTrainingSlot(payload),
    });

  const branches: Branch[] = branchesRes?.data ?? [];
  const shiftTemplates: PTShiftTemplate[] = shiftTemplatesRes?.data ?? [];
  const branchOptions = branches.map((b) => ({
    label: b.name,
    value: b.id,
  }));
  const shiftTemplateOptions = shiftTemplates.map((t) => ({
    label: `${t.type} (${t.startTime} - ${t.endTime})`,
    value: t.id,
  }));

  const isLoading = isLoadingSchedule || isLoadingAssist || isLoadingTrainingSlots;

  const events = useMemo<EventInput[]>(() => {
    return mergedSchedules.map((item) => {
      const traineeName =
        item.extendedProps.account.profile?.name ?? item.extendedProps.account.email;
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
  }, [mergedSchedules]);

  const trainingSlotEvents = useMemo<EventInput[]>(() => {
    const slots: PTTrainingSlot[] = trainingSlotsRes?.data ?? [];
    return expandShiftSchedulesToBackgroundEvents(slots);
  }, [trainingSlotsRes?.data]);

  const calendarEvents = useMemo<EventInput[]>(() => {
    return [...trainingSlotEvents, ...events];
  }, [trainingSlotEvents, events]);

  const openSetupSlotsModal = () => {
    setupSlotsForm.setFieldsValue({
      slot: {
        branchId: '',
        shiftTemplateId: '',
        fromDate: dayjs(),
        toDate: dayjs().add(6, 'day'),
        maxStudents: 6,
      },
    });
    setSetupSlotsOpen(true);
  };

  const handleSaveTeachingSlots = async () => {
    try {
      const values = await setupSlotsForm.validateFields();
      const row = values.slot;
      if (!row) {
        message.warning('Vui lòng nhập thông tin ca dạy.');
        return;
      }

      await submitTrainingSlot({
        branchId: row.branchId,
        shiftTemplateId: row.shiftTemplateId,
        fromDate: row.fromDate.startOf('day').toISOString(),
        toDate: row.toDate.startOf('day').toISOString(),
        maxStudents: row.maxStudents,
      });

      queryClient.invalidateQueries({ queryKey: ['pt-training-slots'] });
      message.success('Đã tạo ca dạy thành công');
      setSetupSlotsOpen(false);
      setupSlotsForm.resetFields();
    } catch {
      // validation
    }
  };

  const handleEventClick = (info: EventClickArg) => {
    if (info.event.extendedProps?.isTeachingSlot) return;
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
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Lịch dạy PT</h1>
            <p className="mt-1 text-sm text-neutral-300">
              Theo dõi lịch hỗ trợ theo tuần và khung giờ chi tiết. Ô màu cam: chờ
              bạn chấp nhận; ô màu tím: đã chấp nhận. Nền xanh nhạt: ca dạy PT đã
              tạo.
            </p>
          </div>
          <Button
            type="default"
            className="shrink-0 border-neutral-600 bg-neutral-800 text-white hover:bg-neutral-700 hover:text-white"
            onClick={openSetupSlotsModal}
          >
            Thiết lập ca dạy
          </Button>
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
                events={calendarEvents}
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
            .pt-schedule-calendar .fc .pt-teaching-slot-bg {
              border: 1px solid rgba(34, 197, 94, 0.35);
            }
          `}</style>
          {isError || isTrainingSlotsError ? (
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
        footer={
          selectedSchedule?.extendedProps.status === 'PENDING'
            ? [
                <Button
                  key="close"
                  onClick={() => {
                    setDetailOpen(false);
                    setSelectedSchedule(null);
                  }}
                >
                  Đóng
                </Button>,
                <Button
                  key="reject"
                  danger
                  loading={isRejectingAssist}
                  onClick={() => {
                    if (selectedSchedule) rejectAssist(selectedSchedule.id);
                  }}
                >
                  Từ chối
                </Button>,
                <Button
                  key="accept"
                  type="primary"
                  loading={isAcceptingAssist}
                  onClick={() => {
                    if (selectedSchedule) acceptAssist(selectedSchedule.id);
                  }}
                >
                  Chấp nhận
                </Button>,
              ]
            : [
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
              ]
        }
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
                    : selectedSchedule.extendedProps.status === 'PENDING'
                      ? 'orange'
                      : 'red'
                }
              >
                {selectedSchedule.extendedProps.status === 'PENDING'
                  ? 'Chờ chấp nhận'
                  : selectedSchedule.extendedProps.status === 'ACCEPTED'
                    ? 'Đã chấp nhận'
                    : selectedSchedule.extendedProps.status}
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
        title="Thiết lập ca dạy"
        open={setupSlotsOpen}
        onOk={handleSaveTeachingSlots}
        onCancel={() => setSetupSlotsOpen(false)}
        confirmLoading={isCreatingTrainingSlot}
        okText="Lưu"
        cancelText="Hủy"
        width={640}
        destroyOnClose
        styles={{
          body: { background: '#171717' },
          header: { background: '#171717' },
          footer: { background: '#171717' },
        }}
      >
        <p className="mb-4 text-xs text-neutral-400">
          Thiết lập 1 ca dạy theo mẫu ca (shift template) trong khoảng ngày bạn
          chọn. Ca đã tạo sẽ hiển thị nền xanh trên lịch.
        </p>
        <Form form={setupSlotsForm} layout="vertical">
          <div className="rounded-xl border border-neutral-700 bg-neutral-900/70 p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Form.Item
                className="mb-0"
                label={<span className="text-neutral-200">Chi nhánh</span>}
                name={['slot', 'branchId']}
                rules={[{ required: true, message: 'Chọn chi nhánh' }]}
              >
                <Select
                  options={branchOptions}
                  placeholder="Chọn chi nhánh"
                  showSearch
                  optionFilterProp="label"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                className="mb-0"
                label={<span className="text-neutral-200">Ca mẫu</span>}
                name={['slot', 'shiftTemplateId']}
                rules={[{ required: true, message: 'Chọn ca mẫu' }]}
              >
                <Select
                  options={shiftTemplateOptions}
                  placeholder="Chọn ca mẫu"
                  showSearch
                  optionFilterProp="label"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                className="mb-0"
                label={<span className="text-neutral-200">Từ ngày</span>}
                name={['slot', 'fromDate']}
                rules={[{ required: true, message: 'Chọn ngày bắt đầu' }]}
              >
                <DatePicker format="DD/MM/YYYY" className="w-full" size="large" />
              </Form.Item>
              <Form.Item
                className="mb-0"
                label={<span className="text-neutral-200">Đến ngày</span>}
                name={['slot', 'toDate']}
                rules={[
                  { required: true, message: 'Chọn ngày kết thúc' },
                  {
                    validator: (_, value: Dayjs | undefined) => {
                      const fromValue = setupSlotsForm.getFieldValue(['slot', 'fromDate']) as Dayjs | undefined;
                      if (!value || !fromValue) return Promise.resolve();
                      if (value.isBefore(fromValue, 'day')) {
                        return Promise.reject(new Error('Đến ngày phải >= Từ ngày'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <DatePicker format="DD/MM/YYYY" className="w-full" size="large" />
              </Form.Item>
            </div>
            <Form.Item
              className="mb-0 mt-3"
              label={<span className="text-neutral-200">Số học viên tối đa</span>}
              name={['slot', 'maxStudents']}
              rules={[{ required: true, message: 'Nhập số học viên' }]}
            >
              <InputNumber min={1} max={50} className="w-full" size="large" placeholder="Ví dụ: 6" />
            </Form.Item>
          </div>
        </Form>
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
