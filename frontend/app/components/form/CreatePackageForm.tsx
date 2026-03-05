import { createPackage } from '@/app/services/api';
import { CreatePackageRequest } from '@/app/types/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
} from 'antd';
import React from 'react';

interface CreatePackageFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onClose: () => void;
}

type FieldType = {
  name?: string;
  description?: string;
  unit?: 'DAY' | 'MONTH';
  durationValue?: number;
  hasPt?: boolean;
  price?: number;
};

function CreatePackageForm(props: CreatePackageFormProps) {
  const [form] = Form.useForm();
  const { isOpen, setIsOpen, onClose } = props;
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (body: CreatePackageRequest) => createPackage(body),
    onSuccess: () => {
      message.success('Create package successfully');
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      form.resetFields();
      onClose();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message ?? 'Create package failed');
    },
  });

  const onFinish = async (values: FieldType) => {
    mutate(values as CreatePackageRequest);
  };
  return (
    <Modal
      open={isOpen}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      okText="Create"
      confirmLoading={isPending}
      onOk={() => form.submit()}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item<FieldType>
          labelCol={{ span: 24 }}
          label="Package Name"
          name="name"
          rules={[{ required: true, message: 'Pls enter package name!' }]}
        >
          <Input placeholder="Enter package name" />
        </Form.Item>
        <Form.Item<FieldType>
          labelCol={{ span: 24 }}
          label="Package Description"
          name="description"
          rules={[
            { required: true, message: 'Pls enter package description!' },
          ]}
        >
          <Input placeholder="Enter package description" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item<FieldType>
              labelCol={{ span: 24 }}
              label="Unit"
              name="unit"
              rules={[{ required: true, message: 'Pls enter package unit!' }]}
            >
              <Select
                placeholder="Enter package unit"
                options={[
                  { value: 'DAY', label: 'Day' },
                  { value: 'MONTH', label: 'Month' },
                ]}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item<FieldType>
              labelCol={{ span: 24 }}
              label="Package Duration"
              name="durationValue"
              rules={[
                { required: true, message: 'Pls enter package duration!' },
              ]}
            >
              <InputNumber
                placeholder="Enter package duration"
                min={1}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item<FieldType>
              labelCol={{ span: 24 }}
              label="Package Price"
              name="price"
            >
              <InputNumber
                placeholder="Enter package price"
                min={0}
                style={{ width: '100%' }}
                addonAfter={'VND'}
                formatter={(value) =>
                  ` ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item<FieldType>
              label="Is PT included?"
              name="hasPt"
              valuePropName="checked" // rất quan trọng
              initialValue={false} // giá trị mặc định: false
            >
              <Checkbox>Is PT included?</Checkbox>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

export default CreatePackageForm;
