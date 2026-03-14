import { MyPurchasePackage } from "@/types/types";
import { Feather, Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  item: MyPurchasePackage;
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "--/--/----";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "--/--/----";

  return date.toLocaleDateString("vi-VN");
};

const getStatusLabel = (status: MyPurchasePackage["status"]) => {
  switch (status) {
    case "ACTIVE":
      return "ĐÃ KÍCH HOẠT";
    case "PENDING":
      return "CHỜ XỬ LÝ";
    case "EXPIRED":
      return "HẾT HẠN";
    case "CANCELLED":
      return "ĐÃ HỦY";
    case "REJECTED":
      return "BỊ TỪ CHỐI";
    default:
      return status;
  }
};

export default function PackageContractCard({ item }: Props) {
  const ptName = useMemo(() => {
    return (
      item.ptAccount?.profile?.name || item.ptAccount?.email || "Không có PT"
    );
  }, [item.ptAccount]);

  const branchAddress =
    item.branch?.address || item.branch?.name || "Chưa có địa chỉ";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="award" size={24} color="#19F07C" />
          <Text style={styles.headerTitle}>Hợp đồng</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.packageName}>
            {item.package.name.toUpperCase()}
          </Text>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="location-outline" size={24} color="#19F07C" />
            <Text style={styles.infoLabel}>Chi nhánh</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {branchAddress}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="person-outline" size={24} color="#19F07C" />
            <Text style={styles.infoLabel}>PT</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {item.package.hasPt ? ptName : "Không có PT"}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={24} color="#19F07C" />
            <Text style={styles.infoLabel}>Ngày hết hạn</Text>
            <Text style={[styles.infoValue, styles.endDate]}>
              {formatDate(item.endAt)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 360,
    borderRadius: 28,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginRight: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 24,
  },
  packageName: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
  },
  statusBadge: {
    backgroundColor: "#22C55E",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  statusText: {
    color: "#08110A",
    fontSize: 14,
    fontWeight: "800",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    color: "#7C8698",
    fontSize: 14,
    marginTop: 10,
    marginBottom: 10,
    textAlign: "center",
  },
  infoValue: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  endDate: {
    color: "#19F07C",
    fontSize: 17,
  },
});
