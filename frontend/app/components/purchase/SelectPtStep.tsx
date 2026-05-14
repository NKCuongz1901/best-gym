'use client';

import {
  Avatar,
  Card,
  Col,
  DatePicker,
  Divider,
  Empty,
  Input,
  Row,
  Segmented,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
import {
  CalendarOutlined,
  CheckOutlined,
  MailOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { motion } from 'motion/react';
import dayjs from 'dayjs';
import type { AvailablePtAccount } from '@/app/types/types';
import type { PtShiftBuoiFilter } from '@/app/lib/ptShiftClientFilter';
import { formatDate } from '@/app/utils/common';

const { Text, Paragraph } = Typography;

function genderVi(g?: string | null) {
  if (!g) return null;
  const u = g.toUpperCase();
  if (u === 'MALE') return 'Nam';
  if (u === 'FEMALE') return 'Nữ';
  return g;
}

interface SelectPtStepProps {
  loading: boolean;
  pts: AvailablePtAccount[];
  selectedPtId: string | null;
  onSelect: (pt: AvailablePtAccount) => void;
  search: string;
  fromDate?: string;
  toDate?: string;
  shiftBuoi: PtShiftBuoiFilter;
  onShiftBuoiChange: (value: PtShiftBuoiFilter) => void;
  onSearchChange: (value: string) => void;
  onDateRangeChange: (from?: string, to?: string) => void;
}

export default function SelectPtStep({
  loading,
  pts,
  selectedPtId,
  onSelect,
  search,
  fromDate,
  toDate,
  shiftBuoi,
  onShiftBuoiChange,
  onSearchChange,
  onDateRangeChange,
}: SelectPtStepProps) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 text-center"
      >
        <h2 className="text-2xl font-bold text-neutral-900 md:text-3xl">
          Chọn huấn luyện viên cá nhân (PT)
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          Lựa chọn PT phù hợp để đồng hành cùng bạn trong quá trình tập luyện.
        </p>
      </motion.div>

      <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-3 md:grid-cols-2 lg:grid-cols-3">
        <Input
          allowClear
          placeholder="Tìm theo tên/email PT"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <DatePicker.RangePicker
          className="w-full"
          format="DD/MM/YYYY"
          value={[
            fromDate ? dayjs(fromDate, 'YYYY-MM-DD') : null,
            toDate ? dayjs(toDate, 'YYYY-MM-DD') : null,
          ]}
          onChange={(dates) =>
            onDateRangeChange(
              dates?.[0] ? dates[0].format('YYYY-MM-DD') : undefined,
              dates?.[1] ? dates[1].format('YYYY-MM-DD') : undefined,
            )
          }
        />
        <div className="flex flex-col gap-1.5 lg:col-span-1">
          <span className="text-xs text-neutral-500">Buổi (lọc trên máy)</span>
          <Segmented<PtShiftBuoiFilter>
            block
            value={shiftBuoi}
            onChange={(v) => onShiftBuoiChange(v as PtShiftBuoiFilter)}
            options={[
              { label: 'Tất cả', value: 'all' },
              { label: 'Sáng', value: 'morning' },
              { label: 'Trưa', value: 'noon' },
              { label: 'Tối', value: 'evening' },
            ]}
          />
        </div>
      </div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Col xs={24} md={12} key={index}>
              <Card>
                <Skeleton active />
              </Card>
            </Col>
          ))}
        </Row>
      ) : pts.length === 0 ? (
        <Empty description="Hiện chưa có huấn luyện viên nào khả dụng" />
      ) : (
        <Row gutter={[16, 16]}>
          {pts.map((pt, index) => {
            const isSelected = selectedPtId === pt.id;
            const totalSlots = (pt.ptAvailabilityWindows ?? []).reduce(
              (acc, win) => acc + (win.weeklySlots?.length ?? 0),
              0,
            );
            const gLabel = genderVi(pt.profile?.gender);
            return (
              <Col xs={24} md={12} key={pt.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    hoverable
                    onClick={() => onSelect(pt)}
                    className={`transition-all ${
                      isSelected
                        ? 'border-primary shadow-[0_0_0_1px_rgba(59,130,246,0.6)]'
                        : ''
                    }`}
                    styles={{ body: { padding: 18 } }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <Avatar
                          size={48}
                          src={pt.profile?.avatar || undefined}
                          icon={!pt.profile?.avatar ? <UserOutlined /> : undefined}
                        />
                        <div>
                          <h3 className="text-base font-semibold text-neutral-900">
                            {pt.profile?.name || pt.email}
                          </h3>
                          {pt.profile?.phone && (
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {pt.profile.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white">
                          <CheckOutlined />
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {gLabel ? <Tag>{gLabel}</Tag> : null}
                      {pt.profile?.fitnessGoal && (
                        <Tag color="blue">{pt.profile.fitnessGoal}</Tag>
                      )}
                      {totalSlots > 0 ? (
                        <Tag color="green">{totalSlots} ô lịch rảnh</Tag>
                      ) : null}
                    </div>

                    {isSelected ? (
                      <>
                        <Divider className="my-3!" />
                        <div
                          className="rounded-lg bg-neutral-50 px-3 py-3 text-left"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Paragraph className="mb-2! text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Thông tin chi tiết
                          </Paragraph>

                          <div className="space-y-2 text-sm text-neutral-700">
                            <div className="flex gap-2">
                              <MailOutlined className="mt-0.5 shrink-0 text-neutral-400" />
                              <Text copyable={{ text: pt.email }} className="text-neutral-800">
                                {pt.email}
                              </Text>
                            </div>

                            {pt.profile?.dateOfBirth ? (
                              <div className="flex gap-2">
                                <CalendarOutlined className="mt-0.5 shrink-0 text-neutral-400" />
                                <span>
                                  Ngày sinh:{' '}
                                  <strong>{formatDate(pt.profile.dateOfBirth)}</strong>
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <Divider className="my-3! text-neutral-200" />
                          <Paragraph className="mb-2! text-xs font-semibold uppercase tracking-wide text-neutral-500">
                            Chiều cao & cân nặng
                          </Paragraph>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
                              <div className="text-xs text-neutral-500">Chiều cao</div>
                              <div className="font-semibold text-neutral-900">
                                {pt.profile?.height != null && pt.profile.height > 0
                                  ? `${pt.profile.height} cm`
                                  : '180 cm'}
                              </div>
                            </div>
                            <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm">
                              <div className="text-xs text-neutral-500">Cân nặng</div>
                              <div className="font-semibold text-neutral-900">
                                {pt.profile?.weight != null && pt.profile.weight > 0
                                  ? `${pt.profile.weight} kg`
                                  : '70 kg'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </Card>
                </motion.div>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
}
