'use client';

import { SkeletonLoading } from '@/app/components/loading/skeleton';
import { getExerciseById, getExercises } from '@/app/services/api';
import { FILTER_PROPS } from '@/app/types/filters';
import type {
  Exercise,
  ExerciseDetailResponse,
  ExercisesResponse,
} from '@/app/types/types';
import { formatDate } from '@/app/utils/common';
import { levelLabels, muscleGroupLabels } from '@/app/lib/exerciseLabels';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Descriptions,
  Drawer,
  Image,
  Input,
  Space,
  Spin,
  Table,
  TableProps,
  Tag,
  Typography,
  message,
} from 'antd';
import { useState } from 'react';

const { Search } = Input;

export default function AdminExercisePage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null,
  );

  const [filters, setFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 10,
    search: undefined,
  });

  const { data: detailRes, isLoading: detailLoading, isError: detailError } =
    useQuery<ExerciseDetailResponse>({
      queryKey: ['exercise-detail', selectedExerciseId],
      queryFn: () => getExerciseById(selectedExerciseId!),
      enabled: Boolean(drawerOpen && selectedExerciseId),
      retry: 1,
    });

  const detail = detailRes?.data;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
      page: 1,
    }));
  };

  const handleTableChange: TableProps<Exercise>['onChange'] = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      itemsPerPage: pagination.pageSize ?? prev.itemsPerPage,
    }));
  };

  const { data, isLoading } = useQuery<ExercisesResponse>({
    queryKey: ['admin-exercises', filters],
    queryFn: () => getExercises(filters),
  });

  const exercises: Exercise[] = data?.data ?? [];

  const openDetail = (record: Exercise) => {
    setSelectedExerciseId(record.id);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedExerciseId(null);
  };

  const columns: TableProps<Exercise>['columns'] = [
    {
      title: 'Thumbnail',
      key: 'thumbnail',
      width: 88,
      render: (_: unknown, record: Exercise) => (
        <Image
          src={record.thumbnail || '/globe.svg'}
          alt={record.name}
          width={64}
          height={48}
          className="rounded object-cover"
          fallback="/globe.svg"
          preview={false}
        />
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string, record: Exercise) => (
        <Button
          type="link"
          className="h-auto max-w-full whitespace-normal p-0 text-left"
          onClick={() => openDetail(record)}
        >
          {text}
        </Button>
      ),
    },
    {
      title: 'Muscle group',
      dataIndex: 'muscleGroup',
      key: 'muscleGroup',
      render: (v: Exercise['muscleGroup']) => muscleGroupLabels[v] ?? v,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      render: (v: Exercise['level']) => levelLabels[v] ?? v,
    },
    {
      title: 'Equipments',
      dataIndex: 'equipments',
      key: 'equipments',
      ellipsis: true,
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) =>
        active ? <Tag color="green">Yes</Tag> : <Tag>No</Tag>,
    },
    {
      title: 'Created at',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right',
      width: 160,
      render: (_: unknown, record: Exercise) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} size="small">
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small">
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-4 rounded bg-gray-50 p-4">
        <Search
          allowClear
          placeholder="Search by name or description..."
          className="max-w-md flex-1"
          onChange={handleSearch}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() =>
            message.info('Thêm bài tập — sẽ gắn form khi bạn có API tạo.')
          }
        >
          Add exercise
        </Button>
      </div>
      <div className="rounded bg-gray-50 p-4">
        {isLoading ? (
          <SkeletonLoading />
        ) : (
          <Table<Exercise>
            columns={columns}
            dataSource={exercises}
            rowKey="id"
            scroll={{ x: 1100 }}
            pagination={{
              current: filters.page,
              pageSize: filters.itemsPerPage,
              total: data?.meta.total,
              showSizeChanger: true,
            }}
            onChange={handleTableChange}
          />
        )}
      </div>

      <Drawer
        title={detail?.name ?? 'Chi tiết bài tập'}
        placement="right"
        width={560}
        open={drawerOpen}
        onClose={closeDrawer}
        destroyOnClose
      >
        {detailLoading ? (
          <div className="flex justify-center py-12">
            <Spin size="large" />
          </div>
        ) : detailError ? (
          <p className="text-red-500">Không tải được chi tiết bài tập.</p>
        ) : detail ? (
          <div className="space-y-4">
            {detail.thumbnail ? (
              <Image
                src={detail.thumbnail}
                alt={detail.name}
                className="max-h-48 w-full rounded object-cover"
                fallback="/globe.svg"
              />
            ) : null}
            {detail.videoUrl?.trim() ? (
              <div className="aspect-video w-full overflow-hidden rounded bg-neutral-900">
                <iframe
                  src={detail.videoUrl}
                  title={detail.name}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ID">{detail.id}</Descriptions.Item>
              <Descriptions.Item label="Name">{detail.name}</Descriptions.Item>
              <Descriptions.Item label="Description">
                <Typography.Paragraph className="mb-0">
                  {detail.description}
                </Typography.Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="Content">
                <Typography.Paragraph className="mb-0 whitespace-pre-wrap">
                  {detail.content || '—'}
                </Typography.Paragraph>
              </Descriptions.Item>
              <Descriptions.Item label="Muscle group">
                {muscleGroupLabels[detail.muscleGroup] ?? detail.muscleGroup}
              </Descriptions.Item>
              <Descriptions.Item label="Level">
                {levelLabels[detail.level] ?? detail.level}
              </Descriptions.Item>
              <Descriptions.Item label="Equipments">
                {detail.equipments || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Suggestion">
                {detail.suggestion || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Active">
                {detail.isActive ? (
                  <Tag color="green">Yes</Tag>
                ) : (
                  <Tag>No</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Created at">
                {formatDate(detail.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated at">
                {formatDate(detail.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          <p className="text-neutral-500">Không tải được dữ liệu.</p>
        )}
      </Drawer>
    </>
  );
}
