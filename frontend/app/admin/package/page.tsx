'use client';
import CreatePackageForm from '@/app/components/form/CreatePackageForm';
import { SkeletonLoading } from '@/app/components/loading/skeleton';
import { getPackages } from '@/app/services/api';
import { FILTER_PACKAGE_PROPS } from '@/app/types/filters';
import { PackagesResponse } from '@/app/types/types';
import { formatDate, formatNumber } from '@/app/utils/common';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Select, Space, Table, TableProps } from 'antd';
import { useState } from 'react';
const { Search } = Input;

interface DataType {
  id: string;
  name: string;
  description: string | null;
  unit: 'DAY' | 'MONTH';
  durationValue: number;
  hasPt: boolean;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const columns: TableProps<DataType>['columns'] = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    hidden: true,
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: 'Unit',
    dataIndex: 'unit',
    key: 'unit',
  },
  {
    title: 'Duration Value',
    dataIndex: 'durationValue',
    key: 'durationValue',
  },
  {
    title: 'Has PT',
    render: (_value, record: DataType) =>
      record.hasPt ? <CheckOutlined /> : <CloseOutlined />,
  },
  {
    title: 'Price',
    dataIndex: 'price',
    key: 'price',
    render: (_value, record: DataType) => formatNumber(record.price),
  },
  {
    title: 'Is Active',
    dataIndex: 'isActive',
    key: 'isActive',
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (_value, record: DataType) => formatDate(record.createdAt),
  },
  {
    title: 'Action',
    dataIndex: 'action',
    key: 'action',
    render: (text: string, record: DataType) => (
      <Space>
        <Button type="link" icon={<EditOutlined />}>
          Edit
        </Button>
        <Button type="link" icon={<DeleteOutlined />}>
          Delete
        </Button>
      </Space>
    ),
  },
];

export default function AdminPackagePage() {
  const [isCreatePackageModalOpen, setIsCreatePackageModalOpen] =
    useState(false);
  const [filters, setFilters] = useState<FILTER_PACKAGE_PROPS>({
    page: 1,
    itemsPerPage: 10,
    unit: undefined,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['packages', filters],
    queryFn: () => getPackages(filters),
  });

  return (
    <>
      <div className="bg-gray-50 p-4 rounded mb-8 flex gap-2 w-[50%]">
        <Search placeholder="Search name of package" onChange={() => {}} />
        <Select
          options={[
            { value: null, label: 'All' },
            { value: 'DAY', label: 'Day' },
            { value: 'MONTH', label: 'Month' },
          ]}
          className="w-[50%]"
          defaultValue={null}
          onChange={(value) => {
            setFilters(
              (prev) =>
                ({
                  ...prev,
                  unit: value as 'DAY' | 'MONTH' | null,
                }) as FILTER_PACKAGE_PROPS,
            );
          }}
        />
      </div>
      <div className="bg-gray-50 p-4 rounded mb-8">
        <div className="flex align-center w-[50%]">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsCreatePackageModalOpen(true)}
          >
            Add package
          </Button>
        </div>
        {isLoading ? (
          <SkeletonLoading />
        ) : (
          <Table
            columns={columns}
            dataSource={data?.data ?? []}
            rowKey="id"
            pagination={{
              current: filters.page,
              pageSize: filters.itemsPerPage,
              total: data?.meta.total,
              showSizeChanger: true,
            }}
            // onChange={handleTableChange}
          />
        )}
      </div>
      <CreatePackageForm
        isOpen={isCreatePackageModalOpen}
        setIsOpen={setIsCreatePackageModalOpen}
        onClose={() => setIsCreatePackageModalOpen(false)}
      />
    </>
  );
}
