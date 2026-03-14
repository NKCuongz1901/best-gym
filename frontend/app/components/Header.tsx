'use client';

import { Menu, Button, Modal, Form, Input, message, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getMe, signin } from '../services/api';
import { appRoute } from '../config/appRoute';

const menuItems = [
  { key: '/', label: <Link href="/">Home</Link> },
  { key: '/about', label: <Link href="/about">About</Link> },
  {
    key: '/packages',
    label: <Link href={appRoute.home.packages}>Packages</Link>,
  },
  { key: '/shop', label: <Link href="/shop">Excercise</Link> },
  { key: '/events', label: <Link href="/events">Coaches</Link> },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isLoggedIn, setAuth, clearAuth } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSignIn = () => {
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const { access_token } = await signin(values.email, values.password);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('access_token', access_token);
      }
      const me = await getMe();
      setAuth(access_token, me);
      message.success('Đăng nhập thành công');
      form.resetFields();
      setIsModalOpen(false);
    } catch (err: unknown) {
      let msg = 'Email hoặc mật khẩu không đúng';
      if (err && typeof err === 'object') {
        const obj = err as { message?: unknown };
        if (typeof obj.message === 'string') msg = obj.message;
      }
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const handleLogout = () => {
    clearAuth();
  };

  const userMenuItems: MenuProps['items'] = [
    ...(user?.role === 'USER'
      ? [
          {
            key: 'my-packages',
            label: <Link href="/my-packages">Gói tập đã đăng ký</Link>,
          },
        ]
      : []),
    ...(user?.role === 'PT'
      ? [
          {
            key: 'pt-students',
            label: <Link href="/pt/trainee">Danh sách học viên</Link>,
          },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [{ key: 'admin', label: <Link href="/admin">Admin page</Link> }]
      : []),
    { key: 'logout', label: 'Đăng xuất', danger: true, onClick: handleLogout },
  ];

  return (
    <header className="w-full bg-black px-6 md:px-12">
      <div className="mx-auto flex min-h-[88px] w-full max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center">
          <Image
            src="/Header_Logo.png"
            alt="Logo"
            width={150}
            height={52}
            priority
            className="object-contain"
          />
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <Menu
            mode="horizontal"
            selectedKeys={[pathname]}
            items={menuItems}
            theme="dark"
            style={{ background: 'transparent', borderBottom: 'none' }}
          />
        </div>

        {isLoggedIn ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={['hover']}
            placement="bottomRight"
          >
            <span className="cursor-pointer text-white hover:underline">
              {user?.email}
            </span>
          </Dropdown>
        ) : (
          <>
            <Button
              type="primary"
              shape="square"
              size="large"
              onClick={handleSignIn}
              className="header-login-btn"
            >
              Sign in
            </Button>
            <Button type="primary" shape="square" size="large">
              Register
            </Button>
          </>
        )}
      </div>

      <Modal
        title="Sign in"
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        okText="Đăng nhập"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input type="email" placeholder="example@email.com" size="large" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </header>
  );
}
