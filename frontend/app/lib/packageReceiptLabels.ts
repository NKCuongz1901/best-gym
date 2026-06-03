import type { MyPurchasePackage } from '@/app/types/types';
import { formatDate, formatNumber } from '@/app/utils/common';

export const PACKAGE_STATUS_LABELS: Record<
  MyPurchasePackage['status'],
  string
> = {
  PENDING: 'Chờ kích hoạt',
  ACTIVE: 'Đang hoạt động',
  EXPIRED: 'Hết hạn',
  CANCELLED: 'Đã hủy',
  REJECTED: 'Bị từ chối',
};

export interface ReceiptRow {
  label: string;
  value: string;
}

export function buildPackageReceiptRows(
  item: MyPurchasePackage,
  memberLabel: string,
): ReceiptRow[] {
  const pkg = item.package;
  const branch = item.branch;
  const unitLabel = pkg.unit === 'DAY' ? 'ngày' : 'tháng';
  const durationText = `${pkg.durationValue} ${unitLabel}`;
  const priceText = `${formatNumber(pkg.price)} VND`;

  const granted = item.ptSessionsGranted ?? pkg.ptSessionsIncluded ?? null;
  const remaining =
    typeof item.ptSessionsRemaining === 'number'
      ? item.ptSessionsRemaining
      : null;

  const rows: ReceiptRow[] = [
    { label: 'Hội viên', value: memberLabel },
    { label: 'Mã đăng ký', value: item.id },
    { label: 'Gói tập', value: pkg.name },
    { label: 'Thời hạn gói', value: durationText },
    { label: 'Giá', value: priceText },
    { label: 'Chi nhánh', value: branch.name },
  ];

  if (branch.address?.trim()) {
    rows.push({ label: 'Địa chỉ', value: branch.address.trim() });
  }

  rows.push({
    label: 'Trạng thái',
    value: PACKAGE_STATUS_LABELS[item.status] ?? item.status,
  });

  rows.push({
    label: 'Ngày đăng ký',
    value: formatDate(item.createdAt),
  });

  if (item.startAt || item.endAt) {
    const start = item.startAt ? formatDate(item.startAt) : '—';
    const end = item.endAt ? formatDate(item.endAt) : '—';
    rows.push({ label: 'Hiệu lực', value: `${start} → ${end}` });
  }

  if (pkg.hasPt) {
    rows.push({
      label: 'Buổi PT',
      value: `${remaining ?? '—'} còn lại / ${granted ?? '—'} tổng`,
    });
  }

  if (pkg.description?.trim()) {
    rows.push({ label: 'Mô tả', value: pkg.description.trim() });
  }

  return rows;
}

export function packageReceiptFilename(item: MyPurchasePackage): string {
  const slug = item.package.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
    .toLowerCase();
  return `powerfit-${slug || item.id.slice(0, 8)}.pdf`;
}
