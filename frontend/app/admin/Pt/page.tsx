'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Table,
  TableProps,
  Typography,
  message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { AxiosError } from 'axios';

import { SkeletonLoading } from '@/app/components/loading/skeleton';
import { createPtAccount, getPtAccounts } from '@/app/services/api';
import { FILTER_PROPS } from '@/app/types/filters';
import type {
  CreatePtAccountRequest,
  PtAccount,
  PtAccountsResponse,
} from '@/app/types/types';

const { Search } = Input;
const { Text } = Typography;

const PT_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;

const genderOptions = [
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
];

function genderLabel(g?: string | null) {
  if (g === 'MALE') return 'Nam';
  if (g === 'FEMALE') return 'Nữ';
  return '—';
}

function getApiErrorMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<{ message?: string | string[] }>;
  const raw = axiosErr?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join(', ');
  if (typeof raw === 'string') return raw;
  return fallback;
}

export default function AdminPtPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm<CreatePtAccountRequest>();

  const [filters, setFilters] = useState<FILTER_PROPS>({
    page: 1,
    itemsPerPage: 10,
    search: '',
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters({
      ...filters,
      search: value,
      page: 1,
    });
  };

  const handleTableChange: TableProps<PtAccount>['onChange'] = (pagination) => {
    setFilters((prev) => ({
      ...prev,
      page: pagination.current ?? 1,
      itemsPerPage: pagination.pageSize ?? prev.itemsPerPage!,
    }));
  };

  const { data, isLoading } = useQuery<PtAccountsResponse>({
    queryKey: ['admin-pt', filters],
    queryFn: () => getPtAccounts(filters),
  });

  const ptData: PtAccount[] = data?.data ?? [];

  const { mutate: submitCreatePt, isPending: isCreatingPt } = useMutation({
    mutationFn: (payload: CreatePtAccountRequest) => createPtAccount(payload),
    onSuccess: (res) => {
      message.success(res.message || 'Đã tạo tài khoản PT');
      queryClient.invalidateQueries({ queryKey: ['admin-pt'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-pt-count'] });
      setCreateModalOpen(false);
      createForm.resetFields();
    },
    onError: (err) => {
      message.error(getApiErrorMessage(err, 'Không thể tạo tài khoản PT'));
    },
  });

  const openCreateModal = () => {
    createForm.resetFields();
    setCreateModalOpen(true);
  };

  const handleCreatePt = async () => {
    try {
      const values = await createForm.validateFields();
      submitCreatePt({
        email: values.email.trim(),
        password: values.password,
        confirmPassword: values.confirmPassword,
        name: values.name.trim(),
        phone: values.phone?.trim() || undefined,
        gender: values.gender,
      });
    } catch {
      // validation failed
    }
  };

  const columns: TableProps<PtAccount>['columns'] = [
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Họ tên',
      key: 'name',
      render: (_value, record) => record.profile?.name ?? '—',
    },
    {
      title: 'SĐT',
      key: 'phone',
      render: (_value, record) => record.profile?.phone ?? '—',
    },
    {
      title: 'Giới tính',
      key: 'gender',
      render: (_value, record) => genderLabel(record.profile?.gender),
    },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded bg-gray-50 p-4">
        <div>
          <Text strong className="text-base!">
            Quản lý PT
          </Text>
          <div>
            <Text type="secondary" className="text-sm">
              Tạo tài khoản PT mới (đã kích hoạt, không cần xác thực email).
            </Text>
          </div>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
          Tạo tài khoản PT
        </Button>
      </div>

      <div className="mb-8 rounded bg-gray-50 p-4">
        <Search
          placeholder="Tìm theo email..."
          allowClear
          onChange={handleSearch}
          className="max-w-md"
        />
      </div>

      <div className="rounded bg-gray-50 p-4">
        {isLoading ? (
          <SkeletonLoading />
        ) : (
          <Table<PtAccount>
            columns={columns}
            dataSource={ptData}
            rowKey="id"
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
        title="Tạo tài khoản PT"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreatePt}
        confirmLoading={isCreatingPt}
        okText="Tạo tài khoản"
        cancelText="Hủy"
        destroyOnClose
        width={520}
      >
        <Form form={createForm} layout="vertical" className="mt-2">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="pt@bestgym.com" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
          >
            <Input placeholder="Nguyễn Văn A" />
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input placeholder="0901234567" />
          </Form.Item>
          <Form.Item name="gender" label="Giới tính">
            <Select
              allowClear
              placeholder="Chọn giới tính"
              options={genderOptions}
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
              {
                pattern: PT_PASSWORD_PATTERN,
                message:
                  'Cần chữ hoa, chữ thường, số và ký tự đặc biệt (@$!%*?&)',
              },
            ]}
          >
            <Input.Password placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Nhập lại mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error('Mật khẩu nhập lại không khớp'),
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
