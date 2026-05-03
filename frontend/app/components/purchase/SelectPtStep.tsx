'use client';

import { Avatar, Card, Col, DatePicker, Empty, Input, Row, Skeleton, Tag } from 'antd';
import { UserOutlined, CheckOutlined } from '@ant-design/icons';
import { motion } from 'motion/react';
import dayjs from 'dayjs';
import type { AvailablePtAccount } from '@/app/types/types';

interface SelectPtStepProps {
  loading: boolean;
  pts: AvailablePtAccount[];
  selectedPtId: string | null;
  onSelect: (pt: AvailablePtAccount) => void;
  search: string;
  fromDate?: string;
  toDate?: string;
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

      <div className="mb-5 grid grid-cols-1 gap-3 rounded-xl border border-neutral-200 bg-white p-3 md:grid-cols-2">
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
                    bodyStyle={{ padding: 18 }}
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
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs text-white">
                          <CheckOutlined />
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {pt.profile?.gender && (
                        <Tag>
                          {pt.profile.gender === 'MALE' ? 'Nam' : 'Nữ'}
                        </Tag>
                      )}
                      {pt.profile?.fitnessGoal && (
                        <Tag color="blue">{pt.profile.fitnessGoal}</Tag>
                      )}
                      {totalSlots > 0 ? (
                        <Tag color="green">{totalSlots} ô lịch rảnh</Tag>
                      ) : null}
                    </div>
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
