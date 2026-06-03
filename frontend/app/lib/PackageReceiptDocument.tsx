import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import {
  buildPackageReceiptRows,
  type ReceiptRow,
} from '@/app/lib/packageReceiptLabels';
import type { MyPurchasePackage } from '@/app/types/types';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSans',
    fontSize: 10,
    color: '#171717',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b',
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    color: '#171717',
    letterSpacing: 1,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 11,
    color: '#525252',
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: 700,
    color: '#171717',
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  rowLast: {
    flexDirection: 'row',
  },
  labelCell: {
    width: '32%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fafafa',
    fontWeight: 700,
    color: '#404040',
  },
  valueCell: {
    width: '68%',
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: '#171717',
  },
  footer: {
    marginTop: 28,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    fontSize: 9,
    color: '#737373',
    lineHeight: 1.5,
  },
  issuedAt: {
    marginTop: 8,
    fontSize: 9,
    color: '#a3a3a3',
  },
});

interface PackageReceiptDocumentProps {
  item: MyPurchasePackage;
  memberLabel: string;
  issuedAt: string;
}

function ReceiptTableRow({
  row,
  isLast,
}: {
  row: ReceiptRow;
  isLast?: boolean;
}) {
  return (
    <View style={isLast ? styles.rowLast : styles.row}>
      <Text style={styles.labelCell}>{row.label}</Text>
      <Text style={styles.valueCell}>{row.value}</Text>
    </View>
  );
}

export default function PackageReceiptDocument({
  item,
  memberLabel,
  issuedAt,
}: PackageReceiptDocumentProps) {
  const rows = buildPackageReceiptRows(item, memberLabel);

  return (
    <Document
      title={`PowerFit - ${item.package.name}`}
      author="PowerFit Gym"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>POWERFIT GYM</Text>
          <Text style={styles.subtitle}>
            Xác nhận đăng ký gói tập / Package registration receipt
          </Text>
          <Text style={styles.title}>{item.package.name}</Text>
        </View>

        <View style={styles.table}>
          {rows.map((row, index) => (
            <ReceiptTableRow
              key={row.label}
              row={row}
              isLast={index === rows.length - 1}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Text>
            Tài liệu này mang tính tham khảo, xác nhận thông tin gói tập bạn đã
            đăng ký trên hệ thống PowerFit. Vui lòng liên hệ lễ tân chi nhánh
            nếu cần hỗ trợ thêm.
          </Text>
          <Text style={styles.issuedAt}>Xuất lúc: {issuedAt}</Text>
        </View>
      </Page>
    </Document>
  );
}
