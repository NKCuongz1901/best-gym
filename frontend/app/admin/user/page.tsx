'use client';
import { SkeletonLoading } from '@/app/components/loading/skeleton';
import { getAccountUser } from '@/app/services/api';
import { FILTER_PROPS } from '@/app/types/filters';
import { UserAccountsResponse } from '@/app/types/types';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Space, Table, TableProps } from 'antd';
import { useState } from 'react';
const { Search } = Input;

interface DataType {
  id?: string;
  email?: string;
  profile?: {
    name: string | null;
  };
}

const columns: TableProps<DataType>['columns'] = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
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

export default function AdminUserPage() {
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

  const handleTableChange: TableProps<DataType>['onChange'] = (
    pagination,
    _filters,
    _sorter,
  ) => {
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

  const usersData: any = data?.data ?? [];

  return (
    <>
      <div className="bg-gray-50 p-4  rounded mb-8">
        <Search placeholder="Search user" onChange={handleSearch} />
      </div>
      <div className="bg-gray-50 p-4 rounded mb-8">
        {isLoading ? (
          <SkeletonLoading />
        ) : (
          <Table
            columns={columns}
            dataSource={usersData ?? []}
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
    </>
  );
}
