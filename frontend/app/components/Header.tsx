'use client';

import { Menu, Button, Modal, Form, Input, message, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { getMe, signUp, signin, verifyAccount } from '../services/api';
import { appRoute } from '../config/appRoute';

const menuItems = [
  { key: '/', label: <Link href="/">Home</Link> },
  { key: '/about', label: <Link href="/about">About</Link> },
  {
    key: '/packages',
    label: <Link href={appRoute.home.packages}>Packages</Link>,
  },
  { key: '/exercises', label: <Link href="/exercises">Exercises</Link> },
  { key: '/events', label: <Link href="/events">Coaches</Link> },
];

export default function Header() {
  const pathname = usePathname();
  const { user, isLoggedIn, setAuth, clearAuth } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpStep, setSignUpStep] = useState<'signUp' | 'verifyAccount'>(
    'signUp',
  );
  const [signUpEmail, setSignUpEmail] = useState('');
  const [verificationCodeDraft, setVerificationCodeDraft] = useState('');
  const [signUpForm] = Form.useForm();
  const [verifyForm] = Form.useForm();
  const verificationCodeInputRef = useRef<any>(null);

  useEffect(() => {
    if (signUpStep === 'verifyAccount' && signUpEmail) {
      verifyForm.setFieldsValue({ email: signUpEmail });
    }
  }, [signUpStep, signUpEmail, verifyForm]);

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

  const handleOpenSignUp = () => {
    setSignUpStep('signUp');
    setSignUpEmail('');
    setVerificationCodeDraft('');
    signUpForm.resetFields();
    verifyForm.resetFields();
    setIsSignUpOpen(true);
  };

  const handleSignUpCancel = () => {
    setIsSignUpOpen(false);
    setSignUpStep('signUp');
    setSignUpEmail('');
    setVerificationCodeDraft('');
    signUpForm.resetFields();
    verifyForm.resetFields();
  };

  const handleSignUpSubmit = async () => {
    try {
      const values = await signUpForm.validateFields();
      setSignUpLoading(true);
      await signUp({
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      setSignUpEmail(values.email);
      setVerificationCodeDraft('');
      verifyForm.setFieldsValue({
        email: values.email,
      });
      setSignUpStep('verifyAccount');
      message.success('Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.');
    } catch (err: unknown) {
      let msg = 'Đăng ký thất bại. Vui lòng thử lại.';
      if (err && typeof err === 'object') {
        const obj = err as { message?: unknown };
        if (typeof obj.message === 'string') msg = obj.message;
      }
      message.error(msg);
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleVerifyAccountSubmit = async () => {
    try {
      // validate để show error UI, nhưng luôn ưu tiên đọc mã xác thực từ state local
      const values = await verifyForm.validateFields();
      setSignUpLoading(true);
      const email = values.email || signUpEmail;
      const rawCode =
        values.verificationCode ??
        verifyForm.getFieldValue('verificationCode') ??
        verificationCodeDraft ??
        verificationCodeInputRef.current?.value;
      const verificationCode = String(rawCode ?? '').trim();

      if (!email) {
        message.error('Email không hợp lệ');
        return;
      }
      if (!verificationCode) {
        message.error('Vui lòng nhập mã xác thực');
        return;
      }

      await verifyAccount({ email, verificationCode });

      message.success('Xác minh tài khoản thành công');
      handleSignUpCancel();
    } catch (err: unknown) {
      let msg = 'Xác minh thất bại. Vui lòng thử lại.';
      if (err && typeof err === 'object') {
        const obj = err as { message?: unknown };
        if (typeof obj.message === 'string') msg = obj.message;
      }
      message.error(msg);
    } finally {
      setSignUpLoading(false);
    }
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
          {
            key: 'my-schedule',
            label: <Link href="/my-schedule">Lịch tập</Link>,
          },
        ]
      : []),
    ...(user?.role === 'PT'
      ? [
          {
            key: 'pt-students',
            label: <Link href="/pt/trainee">Danh sách học viên</Link>,
          },
          {
            key: 'pt-schedule',
            label: <Link href="/pt/schedule">Lịch dạy</Link>,
          },
        ]
      : []),
    ...(user?.role === 'ADMIN'
      ? [{ key: 'admin', label: <Link href="/admin">Admin page</Link> }]
      : []),
    { key: 'profile', label: <Link href="/profile">Thông tin cá nhân</Link> },
    { key: 'logout', label: 'Đăng xuất', danger: true, onClick: handleLogout },
  ];

  return (
    <header className="w-full bg-black px-6 md:px-10">
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

        <div className="hidden flex-1 justify-center sm:flex">
          <Menu
            mode="horizontal"
            selectedKeys={[pathname]}
            items={menuItems}
            theme="dark"
            disabledOverflow
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
            <Button
              type="primary"
              shape="square"
              size="large"
              onClick={handleOpenSignUp}
            >
              Sign up
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

      <Modal
        title={signUpStep === 'signUp' ? 'Sign up' : 'Verify account'}
        open={isSignUpOpen}
        onCancel={handleSignUpCancel}
        footer={null}
        confirmLoading={signUpLoading}
        destroyOnClose
      >
        {signUpStep === 'signUp' ? (
          <Form form={signUpForm} layout="vertical" className="mt-4">
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
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu phải từ 6 ký tự trở lên' },
              ]}
            >
              <Input.Password placeholder="••••••••" size="large" />
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
              <Input.Password placeholder="••••••••" size="large" />
            </Form.Item>

            <div className="flex justify-end gap-3">
              <Button onClick={handleSignUpCancel}>Hủy</Button>
              <Button
                type="primary"
                onClick={handleSignUpSubmit}
                loading={signUpLoading}
              >
                Đăng ký
              </Button>
            </div>
          </Form>
        ) : (
          <Form form={verifyForm} layout="vertical" className="mt-4">
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Email không được để trống' }]}
            >
              <Input readOnly />
            </Form.Item>

            <Form.Item
              name="verificationCode"
              label="Mã xác thực"
              rules={[
                { required: true, message: 'Vui lòng nhập mã xác thực' },
              ]}
            >
              <Input
                placeholder="Nhập mã từ email"
                size="large"
                onChange={(e) => {
                  setVerificationCodeDraft(e.target.value);
                  verifyForm.setFieldsValue({
                    verificationCode: e.target.value,
                  });
                }}
                ref={verificationCodeInputRef}
              />
            </Form.Item>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  setSignUpStep('signUp');
                  verifyForm.resetFields();
                  signUpForm.setFieldsValue({ email: signUpEmail });
                }}
              >
                Quay lại
              </Button>
              <Button
                type="primary"
                onClick={handleVerifyAccountSubmit}
                loading={signUpLoading}
              >
                Xác minh
              </Button>
            </div>
          </Form>
        )}
      </Modal>
    </header>
  );
}
