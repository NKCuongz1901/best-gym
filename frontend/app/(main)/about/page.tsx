'use client';

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AimOutlined,
  AppstoreOutlined,
  ArrowRightOutlined,
  CoffeeOutlined,
  SkinOutlined,
  UsergroupAddOutlined,
} from '@ant-design/icons';

type ArticleItem = {
  key: string;
  title: string;
  eyebrow: string;
  description: string;
  bullets: string[];
  icon: React.ReactNode;
};

const articles: ArticleItem[] = [
  {
    key: 'gym-access',
    eyebrow: 'Khong gian tap',
    title: 'Truy cap toan bo phong gym',
    description:
      'Hoi vien co the su dung day du khu vuc cardio, free weight, functional training va recovery trong gio hoat dong.',
    bullets: [
      'Khong gian rong rai, bo tri thong thoang va de di chuyen',
      'Khu tap da dang cho muc tieu giam can, tang co va nang cao suc ben',
      'Quy trinh ve sinh va bao tri duoc thuc hien thuong xuyen',
    ],
    icon: <AimOutlined />,
  },
  {
    key: 'modern-equipment',
    eyebrow: 'Trang thiet bi',
    title: 'Thiet bi tap luyen hien dai',
    description:
      'He thong may tap duoc lua chon theo tieu chi an toan, de su dung va phu hop cho nhieu cap do hoi vien.',
    bullets: [
      'May cardio, ta tu do va thiet bi ho tro tap chuyen biet',
      'Bo sung dung cu cho bai tap core, mobility va functional',
      'Bao tri dinh ky de dam bao trai nghiem tap luyen on dinh',
    ],
    icon: <AppstoreOutlined />,
  },
  {
    key: 'locker-room',
    eyebrow: 'Tien ich',
    title: 'Phong thay do va tu do tien nghi',
    description:
      'Khu thay do duoc thiet ke rieng tu, gon gang va ho tro hoi vien truoc, trong va sau buoi tap.',
    bullets: [
      'Tu do gon gang de bao quan vat dung ca nhan',
      'Khong gian thay do sach se, de su dung',
      'Tang trai nghiem tap luyen lien mach va thuan tien hon',
    ],
    icon: <SkinOutlined />,
  },
  {
    key: 'personal-training',
    eyebrow: 'Ho tro 1-1',
    title: 'Huong dan boi huan luyen vien ca nhan',
    description:
      'Goi co PT giup ban co lo trinh ro rang hon, duoc theo doi ky thuat va dieu chinh bai tap sat voi muc tieu.',
    bullets: [
      'Dong hanh boi doi ngu PT co chuyen mon',
      'Ho tro dieu chinh bai tap theo the trang va tien do',
      'Toi uu hieu qua tap luyen va giam nguy co sai ky thuat',
    ],
    icon: <UsergroupAddOutlined />,
  },
  {
    key: 'nutrition-support',
    eyebrow: 'Dinh duong',
    title: 'Ho tro tu van dinh duong',
    description:
      'Ben canh lich tap, ban co them dinh huong de can bang che do an va phuc hoi tot hon.',
    bullets: [
      'Goi y thoi quen an uong phu hop voi muc tieu',
      'Dong bo giua tap luyen, nghi ngoi va phuc hoi',
      'De dang xay dung nen tang suc khoe ben vung',
    ],
    icon: <CoffeeOutlined />,
  },
];

function ArticleCard({ item }: { item: ArticleItem }) {
  return (
    <article
      id={item.key}
      className="scroll-mt-28 rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm transition-colors"
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
            {item.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-bold text-neutral-900">{item.title}</h2>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-2xl text-white">
          {item.icon}
        </div>
      </div>

      <p className="max-w-3xl text-base leading-7 text-neutral-600">{item.description}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {item.bullets.map((bullet) => (
          <div
            key={bullet}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4"
          >
            <div className="flex items-start gap-3">
              <ArrowRightOutlined className="mt-1 text-xs text-neutral-500" />
              <p className="text-sm leading-6 text-neutral-700">{bullet}</p>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function AboutPage() {
  const searchParams = useSearchParams();
  const activeArticle = searchParams.get('article');

  const currentArticle = useMemo(
    () => articles.find((item) => item.key === activeArticle) ?? articles[0],
    [activeArticle],
  );

  useEffect(() => {
    if (!activeArticle) return;

    const id = window.setTimeout(() => {
      const el = document.getElementById(activeArticle);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);

    return () => window.clearTimeout(id);
  }, [activeArticle]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <section className="border-b border-neutral-200 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f7f7f7_55%,#efefef_100%)]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-12">
          <div className="max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
              About PowerFit
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-neutral-900 md:text-6xl">
              Khong chi la goi tap, day la toan bo trai nghiem tap luyen.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-600 md:text-lg">
              Kham pha cac tien ich, dich vu va khong gian tap luyen duoc thiet ke de
              giup ban tap hieu qua hon, thoai mai hon va ben vung hon.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {articles.map((item) => {
              const isActive = item.key === currentArticle.key;
              return (
                <a
                  key={item.key}
                  href={`?article=${item.key}`}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-500'
                  }`}
                >
                  {item.title}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14 md:px-12">
        <div className="grid gap-6">
          {articles.map((item) => (
            <ArticleCard key={item.key} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
