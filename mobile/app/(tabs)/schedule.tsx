import { getCheckInHistory } from "@/services/api";
import { CheckInHistoryItem } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";

type MarkedDate = {
  color?: string;
  textColor?: string;
  startingDay?: boolean;
  endingDay?: boolean;
};

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

const today = new Date().toISOString().split("T")[0];

const formatCheckInTime = (value: string) =>
  new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const formatDisplayDate = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const isNextDay = (current: string, next: string) => {
  const currentDate = new Date(`${current}T00:00:00`);
  const nextDate = new Date(`${next}T00:00:00`);

  return nextDate.getTime() - currentDate.getTime() === ONE_DAY_IN_MS;
};

const buildMarkedDates = (dates: string[]) => {
  return dates.reduce<Record<string, MarkedDate>>((acc, date, index) => {
    const previousDate = dates[index - 1];
    const nextDate = dates[index + 1];
    const hasPrevious = Boolean(previousDate && isNextDay(previousDate, date));
    const hasNext = Boolean(nextDate && isNextDay(date, nextDate));

    acc[date] = {
      color: "#22C55E",
      textColor: "#08110A",
      startingDay: !hasPrevious,
      endingDay: !hasNext,
    };

    return acc;
  }, {});
};

export default function ScheduleScreen() {
  const [selectedDate, setSelectedDate] = useState(today);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["check-in-history"],
    queryFn: getCheckInHistory,
  });

  const groupedHistory = useMemo(
    () => data?.data ?? {},
    [data],
  );

  const checkInDates = useMemo(
    () => Object.keys(groupedHistory).sort(),
    [groupedHistory],
  );

  const markedDates = useMemo(
    () => buildMarkedDates(checkInDates),
    [checkInDates],
  );

  const selectedItems = useMemo<CheckInHistoryItem[]>(
    () => groupedHistory[selectedDate] ?? [],
    [groupedHistory, selectedDate],
  );

  useEffect(() => {
    if (!checkInDates.length) {
      setSelectedDate(today);
      return;
    }

    setSelectedDate((current) =>
      groupedHistory[current] ? current : checkInDates[checkInDates.length - 1],
    );
  }, [checkInDates, groupedHistory]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Lịch tập</Text>
          <Text style={styles.subtitle}>
            Các ngày bạn đã check-in sẽ được đánh dấu trên lịch.
          </Text>
        </View>

        <View style={styles.calendarCard}>
          {isLoading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={styles.stateText}>Đang tải lịch check-in...</Text>
            </View>
          ) : isError ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Không tải được lịch check-in</Text>
              <Text style={styles.stateText}>
                Vui lòng thử lại sau hoặc kiểm tra kết nối mạng.
              </Text>
            </View>
          ) : (
            <Calendar
              current={selectedDate}
              markingType="period"
              markedDates={markedDates}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              hideExtraDays
              theme={{
                calendarBackground: "#101826",
                monthTextColor: "#F8FAFC",
                dayTextColor: "#F8FAFC",
                textDisabledColor: "#475569",
                todayTextColor: "#22C55E",
                arrowColor: "#22C55E",
                selectedDayBackgroundColor: "#22C55E",
                textSectionTitleColor: "#94A3B8",
                textMonthFontWeight: "800",
                textDayFontWeight: "700",
                textDayHeaderFontWeight: "700",
              }}
              style={styles.calendar}
            />
          )}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{formatDisplayDate(selectedDate)}</Text>
          <Text style={styles.summarySubtitle}>
            {selectedItems.length
              ? `Bạn đã check-in ${selectedItems.length} lần trong ngày này.`
              : "Bạn chưa có check-in nào trong ngày này."}
          </Text>

          {selectedItems.length ? (
            selectedItems.map((item) => (
              <View key={item.id} style={styles.checkInItem}>
                <View>
                  <Text style={styles.checkInBranch}>{item.branch.name}</Text>
                  <Text style={styles.checkInMeta}>
                    Mã gói: {item.userPackageId.slice(0, 8)}
                  </Text>
                </View>

                <View style={styles.timeBadge}>
                  <Text style={styles.timeText}>
                    {formatCheckInTime(item.checkedInAt)}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Chưa có buổi tập nào được ghi nhận.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020817",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
  },
  calendarCard: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginBottom: 20,
  },
  calendar: {
    borderRadius: 24,
    paddingBottom: 12,
  },
  stateBox: {
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  stateText: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 12,
  },
  summaryCard: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
  },
  summaryTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textTransform: "capitalize",
  },
  summarySubtitle: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  checkInItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#182235",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 12,
  },
  checkInBranch: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  checkInMeta: {
    color: "#94A3B8",
    fontSize: 13,
  },
  timeBadge: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.16)",
    alignItems: "center",
  },
  timeText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyState: {
    backgroundColor: "#182235",
    borderRadius: 18,
    padding: 18,
  },
  emptyStateText: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
