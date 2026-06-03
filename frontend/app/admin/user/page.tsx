'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  TableProps,
  Tag,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';

import { buildAdminUpdatePayload } from '@/app/lib/adminAccountPayload';
import { SkeletonLoading } from '@/app/components/loading/skeleton';
import { profileFieldRules } from '@/app/lib/profileValidation';
import {
  deactivateUserAccountByAdmin,
  getAccountUser,
  getAdminUserPackagePurchaseHistory,
  updateUserAccountByAdmin,
} from '@/app/services/api';
import { FILTER_ADMIN_USER_PACKAGES_PROPS, FILTER_PROPS } from '@/app/types/filters';
import type {
  AdminUpdateUserRequest,
  AdminUserPackagePurchase,
  AdminUserPackagePurchaseHistoryResponse,
  MyPurchasePackage,
  UserAccount,
  UserAccountsResponse,
} from '@/app/types/types';
import { fitnessGoalLabel } from '@/app/lib/ptFitnessGoal';
import { genderLabelVi, resolvePtAvatarSrcWithFallback } from '@/app/lib/ptProfileDisplay';
import { formatDate, formatNumber } from '@/app/utils/common';

const { Search } = Input;
const { Text } = Typography;

function cellOrDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

const genderOptions = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
];

const fitnessGoalOptions = [
  { value: 'LOSE_WEIGHT', label: 'Giảm cân' },
  { value: 'GAIN_MUSCLE', label: 'Tăng cơ' },
  { value: 'IMPROVE_HEALTH', label: 'Cải thiện sức khỏe' },
  { value: 'MAINTAIN_WEIGHT', label: 'Duy trì cân nặng' },
];

const packageStatusMap: Record<
  MyPurchasePackage['status'],
  { label: string; color: string }
> = {
  PENDING: { label: 'Chờ kích hoạt', color: 'gold' },
  ACTIVE: { label: 'Đang hoạt động', color: 'green' },
  EXPIRED: { label: 'Hết hạn', color: 'default' },
  CANCELLED: { label: 'Đã hủy', color: 'default' },
  REJECTED: { label: 'Bị từ chối', color: 'red' },
};

function getApiErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string | string[] }>;
  const raw = axiosErr?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string' && raw.trim()) return raw;
  return fallback;
}

export default function AdminUserPage() {
  const queryClient = useQueryClient();
  const [editForm] = Form.useForm();
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [historyUser, setHistoryUser] = useState<UserAccount | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize] = useState(8);

  const [filters, setFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 10,
    search: '',
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value,
      page: 1,
    });
  };

  const handleTableChange: TableProps<UserAccount>['onChange'] = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      itemsPerPage: pagination.pageSize ?? prev.itemsPerPage!,
    }));
  };

  const { data, isLoading } = useQuery<UserAccountsResponse>({
    queryKey: ['admin-users', filters],
    queryFn: () => getAccountUser(filters),
  });

  const usersData: UserAccount[] = data?.data ?? [];

  const historyQuery: FILTER_ADMIN_USER_PACKAGES_PROPS = useMemo(
    () => ({
      accountId: historyUser?.id,
      page: historyPage,
      itemsPerPage: historyPageSize,
    }),
    [historyUser?.id, historyPage, historyPageSize],
  );

  const {
    data: purchaseHistoryRes,
    isLoading: isLoadingPurchaseHistory,
    isFetching: isFetchingPurchaseHistory,
  } = useQuery<AdminUserPackagePurchaseHistoryResponse>({
    queryKey: ['admin-user-package-history', historyQuery],
    queryFn: () => getAdminUserPackagePurchaseHistory(historyQuery),
    enabled: !!historyUser?.id,
  });

  const purchaseHistory: AdminUserPackagePurchase[] =
    purchaseHistoryRes?.data ?? [];

  const openPurchaseHistory = (user: UserAccount) => {
    setHistoryUser(user);
    setHistoryPage(1);
  };

  const closePurchaseHistory = () => {
    setHistoryUser(null);
    setHistoryPage(1);
  };

  const purchaseHistoryColumns: TableProps<AdminUserPackagePurchase>['columns'] =
    [
      {
        title: 'Gói tập',
        key: 'package',
        ellipsis: true,
        render: (_: unknown, record) => record.package?.name ?? '—',
      },
      {
        title: 'Chi nhánh',
        key: 'branch',
        ellipsis: true,
        render: (_: unknown, record) => record.branch?.name ?? '—',
      },
      {
        title: 'Giá',
        key: 'price',
        width: 110,
        render: (_: unknown, record) =>
          record.package?.price != null
            ? `${formatNumber(record.package.price)} đ`
            : '—',
      },
      {
        title: 'Trạng thái',
        key: 'status',
        width: 130,
        render: (_: unknown, record) => {
          const s = packageStatusMap[record.status];
          return <Tag color={s?.color}>{s?.label ?? record.status}</Tag>;
        },
      },
      {
        title: 'Ngày mua',
        key: 'createdAt',
        width: 110,
        render: (_: unknown, record) => formatDate(record.createdAt),
      },
      {
        title: 'Hiệu lực',
        key: 'period',
        width: 180,
        render: (_: unknown, record) => {
          if (!record.startAt && !record.endAt) return '—';
          const start = record.startAt ? formatDate(record.startAt) : '—';
          const end = record.endAt ? formatDate(record.endAt) : '—';
          return `${start} → ${end}`;
        },
      },
      {
        title: 'PT',
        key: 'pt',
        width: 100,
        render: (_: unknown, record) =>
          record.package?.hasPt ? (
            <span>
              {record.ptSessionsRemaining ?? '—'}/
              {record.ptSessionsGranted ??
                record.package.ptSessionsIncluded ??
                '—'}
            </span>
          ) : (
            '—'
          ),
      },
    ];

  const { mutate: submitUpdate, isPending: isUpdating } = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AdminUpdateUserRequest;
    }) => updateUserAccountByAdmin(id, payload),
    onSuccess: (res) => {
      message.success(res.message || 'Đã cập nhật hội viên');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-user-count'] });
      setEditOpen(false);
      setEditingUser(null);
      editForm.resetFields();
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'Không thể cập nhật hội viên'));
    },
  });

  const { mutate: submitDeactivate, isPending: isDeactivating } = useMutation({
    mutationFn: (id: string) => deactivateUserAccountByAdmin(id),
    onSuccess: (res) => {
      message.success(res.message || 'Đã vô hiệu hóa tài khoản');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-user-count'] });
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'Không thể vô hiệu hóa tài khoản'));
    },
  });

  const openEdit = (record: UserAccount) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      email: record.email,
      name: record.profile?.name ?? '',
      gender: record.profile?.gender ?? undefined,
      phone: record.profile?.phone ?? '',
      dateOfBirth: record.profile?.dateOfBirth
        ? dayjs(record.profile.dateOfBirth)
        : undefined,
      avatar: record.profile?.avatar ?? '',
      height: record.profile?.height ?? undefined,
      weight: record.profile?.weight ?? undefined,
      fitnessGoal: record.profile?.fitnessGoal ?? undefined,
    });
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditingUser(null);
    editForm.resetFields();
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    try {
      const values = await editForm.validateFields();
      const payload = buildAdminUpdatePayload(values);
      if (Object.keys(payload).length === 0) {
        message.warning('Chưa có thay đổi nào để lưu');
        return;
      }
      submitUpdate({ id: editingUser.id, payload });
    } catch {
      // validation
    }
  };

  const columns: TableProps<UserAccount>['columns'] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ellipsis: true,
      render: (id: string, record) => (
        <Button
          type="link"
          size="small"
          className="h-auto px-0! font-mono text-xs"
          icon={<HistoryOutlined />}
          onClick={() => openPurchaseHistory(record)}
        >
          {id.slice(0, 8)}…
        </Button>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'Họ tên',
      key: 'name',
      width: 120,
      ellipsis: true,
      render: (_: unknown, record) => cellOrDash(record.profile?.name?.trim()),
    },
    {
      title: 'Giới tính',
      key: 'gender',
      width: 90,
      render: (_: unknown, record) =>
        genderLabelVi(record.profile?.gender) ?? '—',
    },
    {
      title: 'SĐT',
      key: 'phone',
      width: 120,
      render: (_: unknown, record) => cellOrDash(record.profile?.phone?.trim()),
    },
    {
      title: 'Ngày sinh',
      key: 'dateOfBirth',
      width: 110,
      render: (_: unknown, record) =>
        record.profile?.dateOfBirth
          ? formatDate(record.profile.dateOfBirth)
          : '—',
    },
    {
      title: 'Avatar',
      key: 'avatar',
      width: 72,
      render: (_: unknown, record) => {
        const src = record.profile?.avatar?.trim();
        if (!src) return '—';
        return (
          <Avatar
            size={40}
            src={resolvePtAvatarSrcWithFallback(src)}
            className="shrink-0"
          />
        );
      },
    },
    {
      title: 'Chiều cao (cm)',
      key: 'height',
      width: 110,
      render: (_: unknown, record) => cellOrDash(record.profile?.height),
    },
    {
      title: 'Cân nặng (kg)',
      key: 'weight',
      width: 110,
      render: (_: unknown, record) => cellOrDash(record.profile?.weight),
    },
    {
      title: 'Mục tiêu',
      key: 'fitnessGoal',
      width: 150,
      ellipsis: true,
      render: (_: unknown, record) =>
        fitnessGoalLabel(record.profile?.fitnessGoal) ?? '—',
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: unknown, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Vô hiệu hóa hội viên?"
            description={`Tài khoản ${record.email} sẽ chuyển sang trạng thái ngưng hoạt động.`}
            okText="Vô hiệu hóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: isDeactivating }}
            onConfirm={() => submitDeactivate(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="mb-8 rounded bg-gray-50 p-4">
        <Search placeholder="Tìm theo email hội viên" onChange={handleSearch} />
      </div>

      <div className="rounded bg-gray-50 p-4">
        {isLoading ? (
          <SkeletonLoading />
        ) : (
          <Table
            columns={columns}
            dataSource={usersData}
            rowKey="id"
            scroll={{ x: 1400 }}
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

      <Modal
        title="Chỉnh sửa hội viên"
        open={editOpen}
        onCancel={closeEdit}
        onOk={handleUpdate}
        okText="Lưu"
        cancelText="Hủy"
        confirmLoading={isUpdating}
        destroyOnClose
        width={560}
      >
        <Form form={editForm} layout="vertical" className="mt-2">
          <Form.Item
            name="email"
            label="Email"
            rules={profileFieldRules.email}
          >
            <Input placeholder="user@email.com" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Họ và tên"
            rules={profileFieldRules.name}
          >
            <Input placeholder="Nguyễn Văn A" maxLength={100} />
          </Form.Item>

          <Form.Item name="gender" label="Giới tính">
            <Select allowClear options={genderOptions} placeholder="Chọn giới tính" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={profileFieldRules.phone}
            validateTrigger="onBlur"
          >
            <Input placeholder="09xxxxxxxx" />
          </Form.Item>

          <Form.Item
            name="dateOfBirth"
            label="Ngày sinh"
            rules={profileFieldRules.dateOfBirth}
          >
            <DatePicker
              className="w-full"
              format="DD/MM/YYYY"
              disabledDate={(current) =>
                current != null && current > dayjs().endOf('day')
              }
            />
          </Form.Item>

          <Form.Item
            name="avatar"
            label="Avatar URL"
            rules={profileFieldRules.avatar}
            validateTrigger="onBlur"
          >
            <Input placeholder="https://... hoặc /uploads/..." />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Form.Item
              name="height"
              label="Chiều cao (cm)"
              rules={profileFieldRules.height}
            >
              <InputNumber className="w-full" min={50} max={300} />
            </Form.Item>
            <Form.Item
              name="weight"
              label="Cân nặng (kg)"
              rules={profileFieldRules.weight}
            >
              <InputNumber className="w-full" min={20} max={500} />
            </Form.Item>
          </div>

          <Form.Item name="fitnessGoal" label="Mục tiêu luyện tập">
            <Select
              allowClear
              options={fitnessGoalOptions}
              placeholder="Chọn mục tiêu"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          historyUser ? (
            <span>
              Lịch sử mua gói —{' '}
              {historyUser.profile?.name?.trim() || historyUser.email}
            </span>
          ) : (
            'Lịch sử mua gói'
          )
        }
        open={!!historyUser}
        onCancel={closePurchaseHistory}
        footer={null}
        width={920}
        destroyOnClose
      >
        {historyUser ? (
          <p className="mb-3 text-sm text-neutral-500">
            Email: {historyUser.email}
            <Text copyable={{ text: historyUser.id }} className="ml-3 text-xs">
              ID: {historyUser.id.slice(0, 8)}…
            </Text>
          </p>
        ) : null}
        <Table<AdminUserPackagePurchase>
          rowKey="id"
          size="small"
          loading={isLoadingPurchaseHistory || isFetchingPurchaseHistory}
          columns={purchaseHistoryColumns}
          dataSource={purchaseHistory}
          scroll={{ x: 800 }}
          locale={{
            emptyText: (
              <Empty description="Hội viên chưa có lịch sử mua gói nào" />
            ),
          }}
          pagination={{
            current: historyPage,
            pageSize: historyPageSize,
            total: purchaseHistoryRes?.meta.total ?? 0,
            showSizeChanger: false,
            onChange: (page) => setHistoryPage(page),
          }}
        />
      </Modal>
    </>
  );
}
