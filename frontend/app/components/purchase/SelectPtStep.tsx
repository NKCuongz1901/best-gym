'use client';

import { Avatar, Card, Col, Empty, Row, Skeleton, Tag } from 'antd';
import { UserOutlined, CheckOutlined } from '@ant-design/icons';
import { motion } from 'motion/react';
import type { PtAccount } from '@/app/types/types';

interface SelectPtStepProps {
  loading: boolean;
  pts: PtAccount[];
  selectedPtId: string | null;
  onSelect: (pt: PtAccount) => void;
}

export default function SelectPtStep({
  loading,
  pts,
  selectedPtId,
  onSelect,
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

