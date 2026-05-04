'use client';

import { appRoute } from '@/app/config/appRoute';
import { getPtAccounts } from '@/app/services/api';
import type { PtAccount, PtAccountsResponse } from '@/app/types/types';
import { UserOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar,
  Card,
  Col,
  Empty,
  Input,
  Pagination,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import Link from 'next/link';
import { useMemo, useState } from 'react';

const { Title, Paragraph, Text } = Typography;

function genderLabel(gender?: string) {
  if (!gender) return null;
  const g = gender.toUpperCase();
  if (g === 'MALE' || g === 'NAM') return 'Nam';
  if (g === 'FEMALE' || g === 'NỮ') return 'Nữ';
  return gender;
}

function PtCoachCard({ pt }: { pt: PtAccount }) {
  const profile = pt.profile;
  const displayName =
    profile?.name?.trim() ||
    pt.email.split('@')[0]?.replace(/\./g, ' ') ||
    'Huấn luyện viên';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Card
      hoverable
      className="h-full overflow-hidden border-neutral-200 shadow-sm transition-shadow hover:shadow-md"
      styles={{ body: { padding: 0 } }}
    >
      <div className="relative h-36 bg-linear-to-br from-neutral-800 to-neutral-950">
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        <div className="absolute -bottom-12 left-1/2 flex -translate-x-1/2 justify-center">
          <Avatar
            size={96}
            src={profile?.avatar || undefined}
            icon={<UserOutlined />}
            className="border-4 border-white text-3xl shadow-lg ring-2 ring-neutral-200"
            alt={displayName}
          >
            {!profile?.avatar ? initial : undefined}
          </Avatar>
        </div>
      </div>

      <div className="px-5 pb-5 pt-14 text-center">
        <Title level={4} className="mb-1! text-lg!">
          {displayName}
        </Title>
        <Text type="secondary" className="text-xs">
          {pt.email}
        </Text>

        <Space wrap className="mt-3 justify-center" size={[6, 6]}>
          {genderLabel(profile?.gender) ? (
            <Tag color="blue">{genderLabel(profile?.gender)}</Tag>
          ) : null}
          {profile?.fitnessGoal ? (
            <Tag color="green" className="max-w-full truncate">
              {profile.fitnessGoal}
            </Tag>
          ) : (
            <Tag>PT chuyên nghiệp</Tag>
          )}
        </Space>

        {(profile?.height != null && profile.height > 0) ||
        (profile?.weight != null && profile.weight > 0) ? (
          <Paragraph type="secondary" className="mb-0! mt-3! text-xs">
            {profile?.height != null && profile.height > 0
              ? `Chiều cao: ${profile.height} cm`
              : null}
            {profile?.height != null &&
            profile.height > 0 &&
            profile?.weight != null &&
            profile.weight > 0
              ? ' · '
              : null}
            {profile?.weight != null && profile.weight > 0
              ? `Cân nặng: ${profile.weight} kg`
              : null}
          </Paragraph>
        ) : null}

        <Link
          href={appRoute.home.packages}
          className="mt-4 inline-block w-full rounded-lg bg-neutral-900 py-2.5 text-center text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          Xem gói tập có PT
        </Link>
      </div>
    </Card>
  );
}

export default function CoachesPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [search, setSearch] = useState('');

  const query = useMemo(
    () => ({
      page,
      itemsPerPage: pageSize,
      search: search.trim() || undefined,
    }),
    [page, pageSize, search],
  );

  const { data, isLoading, isFetching } = useQuery<PtAccountsResponse>({
    queryKey: ['public-pt-coaches', query],
    queryFn: () => getPtAccounts(query),
  });

  const pts: PtAccount[] = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="min-h-[70vh] bg-neutral-50">
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-10 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Đội ngũ PowerFit
          </p>
          <Title level={1} className="mb-3! mt-2! text-3xl! md:text-4xl!">
            Huấn luyện viên cá nhân
          </Title>
          <Paragraph className="mb-0! max-w-2xl text-base text-neutral-600">
            Gặp gỡ các PT đang đồng hành cùng hội viên tại phòng gym. Đăng ký gói có
            PT để được xếp lịch và theo sát mục tiêu của bạn.
          </Paragraph>

          <div className="mt-8 max-w-md">
            <Input.Search
              allowClear
              placeholder="Tìm theo email PT..."
              size="large"
              onSearch={(value) => {
                setSearch(value);
                setPage(1);
              }}
              loading={isFetching && !isLoading}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
        {isLoading ? (
          <Row gutter={[24, 24]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Col xs={24} sm={12} lg={8} key={i}>
                <Card>
                  <Skeleton avatar active paragraph={{ rows: 3 }} />
                </Card>
              </Col>
            ))}
          </Row>
        ) : pts.length === 0 ? (
          <Empty
            description="Chưa có huấn luyện viên nào được hiển thị."
            className="py-16"
          >
            <Link
              href={appRoute.home.packages}
              className="text-neutral-900 underline"
            >
              Khám phá gói tập
            </Link>
          </Empty>
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {pts.map((pt) => (
                <Col xs={24} sm={12} lg={8} key={pt.id}>
                  <PtCoachCard pt={pt} />
                </Col>
              ))}
            </Row>

            {total > pageSize ? (
              <div className="mt-10 flex justify-center">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger={false}
                  onChange={(p) => setPage(p)}
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
