'use client';

import { pdf } from '@react-pdf/renderer';

import PackageReceiptDocument from '@/app/lib/PackageReceiptDocument';
import { packageReceiptFilename } from '@/app/lib/packageReceiptLabels';
import { registerPackageReceiptFonts } from '@/app/lib/packageReceiptFonts';
import type { MyPurchasePackage } from '@/app/types/types';

export async function downloadPackageReceipt(
  item: MyPurchasePackage,
  memberLabel: string,
): Promise<void> {
  registerPackageReceiptFonts();

  const issuedAt = new Date().toLocaleString('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const blob = await pdf(
    <PackageReceiptDocument
      item={item}
      memberLabel={memberLabel}
      issuedAt={issuedAt}
    />,
  ).toBlob();

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = packageReceiptFilename(item);
  link.click();
  URL.revokeObjectURL(url);
}
