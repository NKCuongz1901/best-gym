'use client';

import { CheckOutlined } from '@ant-design/icons';

export type Package = {
  id: string;
  name: string;
  unit: 'DAY' | 'MONTH';
  durationValue: number;
  hasPt: boolean;
  price: number;
  description: string | null;
  isActive: boolean;
};

type PackageCardProps = {
  package: Package;
  isFeatured?: boolean;
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(price);
}

function getUnitLabel(unit: 'DAY' | 'MONTH'): string {
  return unit === 'DAY' ? 'Ngày' : 'Tháng';
}

function getFeatures(pkg: Package): string[] {
  const features = [
    'Truy cập toàn bộ phòng gym',
    'Thiết bị tập luyện hiện đại',
    'Phòng thay đồ, tủ đồ',
  ];
  if (pkg.hasPt) {
    features.push('Huấn luyện viên cá nhân');
  }
  features.push('Hỗ trợ tư vấn dinh dưỡng');
  return features;
}

export default function PackageCard({
  package: pkg,
  isFeatured = false,
}: PackageCardProps) {
  const features = getFeatures(pkg);
  const unitLabel = getUnitLabel(pkg.unit);
  const durationText = `${pkg.durationValue} ${unitLabel}`;

  return (
    <div className="group flex flex-col rounded-2xl border p-8 transition-all border-neutral-200 bg-white text-neutral-800 hover:border-neutral-800 hover:bg-neutral-900 hover:text-white hover:shadow-xl">
      <h3
        className="
       text-xl font-medium
       text-neutral-800
       group-hover:text-white
     "
      >
        {pkg.name}
      </h3>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-neutral-900 group-hover:text-white">
          {formatPrice(pkg.price)} ₫
        </span>
        <span className="text-base font-normal text-neutral-500">
          / {durationText}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-neutral-500 group-hover:text-neutral-300">
        {pkg.description ||
          'Gói tập luyện linh hoạt, phù hợp với nhu cầu của bạn. Truy cập đầy đủ trang thiết bị và không gian tập luyện.'}
      </p>

      <ul className="mt-6 flex-1 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckOutlined className="mt-0.5 shrink-0 text-neutral-600 group-hover:text-white" />
            <span className="text-sm text-neutral-600 group-hover:text-neutral-200">
              {feature}
            </span>
          </li>
        ))}
      </ul>

      <button className="mt-8 w-full rounded-xl px-6 py-3 font-semibold transition-colors bg-neutral-900 text-white hover:bg-neutral-800 group-hover:bg-white group-hover:text-neutral-900">
        Chọn gói
      </button>
    </div>
  );
}
