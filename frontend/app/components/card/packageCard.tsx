"use client";

import { CheckOutlined } from "@ant-design/icons";

export type Package = {
  id: string;
  name: string;
  unit: "DAY" | "MONTH";
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
  return new Intl.NumberFormat("vi-VN", {
    style: "decimal",
    minimumFractionDigits: 0,
  }).format(price);
}

function getUnitLabel(unit: "DAY" | "MONTH"): string {
  return unit === "DAY" ? "Ngày" : "Tháng";
}

function getFeatures(pkg: Package): string[] {
  const features = [
    "Truy cập toàn bộ phòng gym",
    "Thiết bị tập luyện hiện đại",
    "Phòng thay đồ, tủ đồ",
  ];
  if (pkg.hasPt) {
    features.push("Huấn luyện viên cá nhân");
  }
  features.push("Hỗ trợ tư vấn dinh dưỡng");
  return features;
}

export default function PackageCard({ package: pkg, isFeatured = false }: PackageCardProps) {
  const features = getFeatures(pkg);
  const unitLabel = getUnitLabel(pkg.unit);
  const durationText = `${pkg.durationValue} ${unitLabel}`;

  return (
    <div
      className={`flex flex-col rounded-2xl border p-8 transition-all ${
        isFeatured
          ? "border-neutral-800 bg-neutral-900 text-white shadow-xl"
          : "border-neutral-200 bg-white text-neutral-800"
      }`}
    >
      {/* Plan name */}
      <h3
        className={`text-xl font-medium ${
          isFeatured ? "text-white" : "text-neutral-800"
        }`}
      >
        {pkg.name}
      </h3>

      {/* Price */}
      <div className="mt-4 flex items-baseline gap-1">
        <span
          className={`text-4xl font-bold ${
            isFeatured ? "text-white" : "text-neutral-900"
          }`}
        >
          {formatPrice(pkg.price)} ₫
        </span>
        <span className="text-base font-normal text-neutral-500">
          / {durationText}
        </span>
      </div>

      {/* Description */}
      <p
        className={`mt-4 text-sm leading-6 ${
          isFeatured ? "text-neutral-300" : "text-neutral-500"
        }`}
      >
        {pkg.description ||
          "Gói tập luyện linh hoạt, phù hợp với nhu cầu của bạn. Truy cập đầy đủ trang thiết bị và không gian tập luyện."}
      </p>

      {/* Features list */}
      <ul className="mt-6 flex-1 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckOutlined
              className={`mt-0.5 shrink-0 ${
                isFeatured ? "text-white" : "text-neutral-600"
              }`}
            />
            <span
              className={`text-sm ${
                isFeatured ? "text-neutral-200" : "text-neutral-600"
              }`}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* Button */}
      <button
        className={`mt-8 w-full rounded-xl px-6 py-3 font-semibold transition-colors ${
          isFeatured
            ? "bg-white text-neutral-900 hover:bg-neutral-100"
            : "bg-neutral-900 text-white hover:bg-neutral-800"
        }`}
      >
        Chọn gói
      </button>
    </div>
  );
}
