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
  Space,
  Spin,
  Tag,
  TimePicker,
  message,
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

import {
  acceptPTAssistRequest,
  createPTTrainingSlot,
  getBranches,
  getPTAssistRequests,
  getPTAssistSchedule,
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
  date: Dayjs;
  timeRange: [Dayjs, Dayjs];
  capacity: number;
  note?: string;
};

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
  const [setupSlotsForm] = Form.useForm<{ slots: SetupSlotRow[] }>();

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

  const { mutateAsync: submitTrainingSlot, isPending: isCreatingTrainingSlot } =
    useMutation({
      mutationFn: (payload: CreatePTTrainingSlotRequest) =>
        createPTTrainingSlot(payload),
    });

  const branches: Branch[] = branchesRes?.data ?? [];
  const branchOptions = branches.map((b) => ({
    label: b.name,
    value: b.id,
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
    return slots.map((slot) => ({
      id: `pt-training-slot-${slot.id}`,
      start: slot.startTime,
      end: slot.endTime,
      display: 'background',
      backgroundColor: 'rgba(34, 197, 94, 0.16)',
      classNames: ['pt-teaching-slot-bg'],
      extendedProps: { isTeachingSlot: true },
    }));
  }, [trainingSlotsRes?.data]);

  const calendarEvents = useMemo<EventInput[]>(() => {
    return [...trainingSlotEvents, ...events];
  }, [trainingSlotEvents, events]);

  const openSetupSlotsModal = () => {
    setupSlotsForm.setFieldsValue({
      slots: [
        {
          branchId: '',
          date: dayjs(),
          timeRange: [dayjs().hour(9).minute(0), dayjs().hour(12).minute(0)],
          capacity: 6,
          note: '',
        },
      ],
    });
    setSetupSlotsOpen(true);
  };

  const handleSaveTeachingSlots = async () => {
    try {
      const values = await setupSlotsForm.validateFields();
      const rows = values.slots ?? [];
      if (rows.length === 0) {
        message.warning('Thêm ít nhất 1 ca dạy để lưu.');
        return;
      }

      await Promise.all(
        rows.map((row) => {
          const base = row.date.startOf('day');
          const startTime = base
            .hour(row.timeRange[0].hour())
            .minute(row.timeRange[0].minute())
            .second(0)
            .millisecond(0)
            .toISOString();
          const endTime = base
            .hour(row.timeRange[1].hour())
            .minute(row.timeRange[1].minute())
            .second(0)
            .millisecond(0)
            .toISOString();
          return submitTrainingSlot({
            branchId: row.branchId,
            startTime,
            endTime,
            capacity: row.capacity,
            note: row.note?.trim() || undefined,
          });
        }),
      );

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
          Mỗi dòng sẽ tạo 1 ca dạy mới trên hệ thống. Ca đã tạo sẽ hiển thị nền xanh
          trên lịch.
        </p>
        <Form form={setupSlotsForm} layout="vertical" className="max-h-[60vh] overflow-y-auto pr-1">
          <Form.List name="slots">
            {(fields, { add, remove }) => (
              <div className="flex flex-col gap-3">
                {fields.map(({ key, name }) => (
                  <Space
                    key={key}
                    className="w-full flex-wrap items-start"
                    align="start"
                  >
                    <Form.Item
                      className="mb-0 min-w-[170px]"
                      name={[name, 'branchId']}
                      rules={[{ required: true, message: 'Chọn chi nhánh' }]}
                    >
                      <Select
                        options={branchOptions}
                        placeholder="Chi nhánh"
                        showSearch
                        optionFilterProp="label"
                      />
                    </Form.Item>
                    <Form.Item
                      className="mb-0 min-w-[140px]"
                      name={[name, 'date']}
                      rules={[{ required: true, message: 'Chọn ngày' }]}
                    >
                      <DatePicker format="DD/MM/YYYY" />
                    </Form.Item>
                    <Form.Item
                      className="mb-0 min-w-[220px]"
                      name={[name, 'timeRange']}
                      rules={[
                        { required: true, message: 'Chọn giờ' },
                        {
                          validator: (_, value: [Dayjs, Dayjs] | undefined) => {
                            if (!value?.[0] || !value[1]) return Promise.resolve();
                            if (value[1].isAfter(value[0])) return Promise.resolve();
                            return Promise.reject(
                              new Error('Giờ kết thúc phải sau giờ bắt đầu'),
                            );
                          },
                        },
                      ]}
                    >
                      <TimePicker.RangePicker
                        format="HH:mm"
                        minuteStep={15}
                        className="w-[220px]"
                      />
                    </Form.Item>
                    <Form.Item
                      className="mb-0 min-w-[120px]"
                      name={[name, 'capacity']}
                      rules={[{ required: true, message: 'Sức chứa' }]}
                    >
                      <InputNumber min={1} max={50} className="w-[120px]" placeholder="Sức chứa" />
                    </Form.Item>
                    <Form.Item
                      className="mb-0 min-w-[220px] flex-1"
                      name={[name, 'note']}
                    >
                      <Input placeholder="Ghi chú (tuỳ chọn)" />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      aria-label="Xóa ca"
                    />
                  </Space>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      branchId: branchOptions[0]?.value ?? '',
                      date: dayjs(),
                      timeRange: [dayjs().hour(14).minute(0), dayjs().hour(17).minute(0)],
                      capacity: 6,
                      note: '',
                    })
                  }
                  block
                  icon={<PlusOutlined />}
                >
                  Thêm ca
                </Button>
              </div>
            )}
          </Form.List>
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
