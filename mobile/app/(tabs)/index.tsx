import PackageContractCard from "@/components/card/PackageContractCard";
import CategoryItem from "@/components/home/CategoryItem";
import FeaturedWorkoutCard from "@/components/home/FeaturedWorkoutCard";
import {
  createPtAssistRequest,
  getAvailablePTs,
  getPTAssistSchedule,
  getPtWeekBookingGrid,
} from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { useMyPurchasePackages } from "@/stores/useMyPurchasePackages";
import {
  AvailablePtAccount,
  MyPurchasePackage,
  PTAssistSchedule,
  PtWeekGridCell,
} from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const categories = [
  {
    id: "1",
    title: "Cardio",
    icon: <Ionicons name="flame-outline" size={40} color="#08110A" />,
    active: true,
  },
  {
    id: "2",
    title: "Fitness",
    icon: <MaterialCommunityIcons name="dumbbell" size={40} color="#19F07C" />,
  },
  {
    id: "3",
    title: "Boxing",
    icon: <Ionicons name="barbell-outline" size={40} color="#19F07C" />,
  },
  {
    id: "4",
    title: "Yoga",
    icon: <Ionicons name="accessibility-outline" size={40} color="#19F07C" />,
  },
  {
    id: "5",
    title: "Bơi lội",
    icon: <Ionicons name="water-outline" size={40} color="#19F07C" />,
  },
];

const featuredWorkouts = [
  {
    id: "1",
    title: "Massive Legs Training",
    category: "SỨC MẠNH",
    image: require("../../assets/images/workout-hiit.jpg"),
  },
  {
    id: "2",
    title: "Upper Body Power",
    category: "SỨC MẠNH",
    image: require("../../assets/images/workout-legs.jpg"),
  },
  {
    id: "3",
    title: "Morning Flexibility",
    category: "YOGA",
    image: require("../../assets/images/workout-upper.jpg"),
  },
];

const getHomeScheduleRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 14);
  end.setHours(23, 59, 59, 999);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
};

const getPtScheduleStatusLabel = (status: PTAssistSchedule["extendedProps"]["status"]) => {
  switch (status) {
    case "ACCEPTED":
      return "Đã xác nhận";
    case "PENDING":
      return "Chờ xác nhận";
    case "REJECTED":
      return "Đã từ chối";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status;
  }
};

const getPtScheduleStatusColor = (status: PTAssistSchedule["extendedProps"]["status"]) => {
  switch (status) {
    case "ACCEPTED":
      return "#22C55E";
    case "PENDING":
      return "#F59E0B";
    case "REJECTED":
      return "#EF4444";
    case "CANCELLED":
      return "#64748B";
    default:
      return "#22C55E";
  }
};

const formatPtScheduleTime = (start: string, end: string) => {
  const startTime = new Date(start).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = new Date(end).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateText = new Date(start).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

  return `${dateText} • ${startTime} - ${endTime}`;
};

const getTraineeName = (item: PTAssistSchedule) =>
  item.extendedProps.account.profile?.name || item.extendedProps.account.email;

const formatSlotDateLabel = (value: string) =>
  new Date(value).toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

const formatTimeValue = (value: string) => {
  // Supports both ISO datetime and "HH:mm" / "HH:mm:ss" values from shiftTemplate.
  if (value.includes("T")) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }

  const [hour = "00", minute = "00"] = value.split(":");
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

const formatSlotTimeLabel = (startTime: string, endTime: string) =>
  `${formatTimeValue(startTime)} - ${formatTimeValue(endTime)}`;

const formatDayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const parseYmdToLocalDate = (ymd: string) => {
  const [year, month, day] = ymd.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  return new Date(year, month - 1, day);
};

const getDateRangeInDays = (fromIso: string, toIso: string) => {
  const fromDate = new Date(fromIso);
  const toDate = new Date(toIso);
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || fromDate > toDate) {
    return [];
  }

  const result: string[] = [];
  const cursor = new Date(fromDate);
  while (cursor <= toDate) {
    result.push(formatDayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
};

const getIsoWeekStart = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return formatDayKey(d);
};

const DAY_OF_WEEK_LABELS: Record<number, string> = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "CN",
};

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const isPt = user?.role === "PT";
  const { data, isLoading, isRefetching, refetch } = useMyPurchasePackages(!isPt);
  const { data: ptScheduleData, isLoading: isLoadingPtSchedule } = useQuery({
    queryKey: ["home", "pt-assist-schedule"],
    queryFn: () => getPTAssistSchedule(getHomeScheduleRange()),
    enabled: isPt,
  });
  const [selectedPackage, setSelectedPackage] = useState<MyPurchasePackage | null>(
    null,
  );
  const [selectedPtId, setSelectedPtId] = useState("");
  const [weekStart, setWeekStart] = useState(() => getIsoWeekStart(new Date()));
  const [selectedCell, setSelectedCell] = useState<{
    weeklySlotId: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  const [note, setNote] = useState("");
  const { data: availablePtData, isLoading: isLoadingPts } = useQuery({
    queryKey: ["available-pts-for-package", selectedPackage?.id],
    queryFn: () =>
      getAvailablePTs({
        branchId: selectedPackage?.branchId ?? "",
        from: selectedPackage?.startAt?.slice(0, 10),
        to: selectedPackage?.endAt?.slice(0, 10),
      }),
    enabled: !!selectedPackage?.id && !!selectedPackage?.branchId,
  });
  const { data: weekGridData, isLoading: isLoadingWeekGrid } = useQuery({
    queryKey: ["pt-week-booking-grid", selectedPackage?.id, selectedPtId, weekStart],
    queryFn: () =>
      getPtWeekBookingGrid({
        branchId: selectedPackage?.branchId ?? "",
        ptAccountId: selectedPtId,
        weekStart,
      }),
    enabled: !!selectedPackage?.id && !!selectedPackage?.branchId && !!selectedPtId,
  });

  const purchasePackages = useMemo(() => data?.data ?? [], [data]);
  const upcomingPtSchedules = useMemo(() => {
    const schedules = ptScheduleData?.data ?? [];
    const now = Date.now();

    return [...schedules]
      .filter((item) => new Date(item.end).getTime() >= now)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5);
  }, [ptScheduleData]);
  const ptRequestMutation = useMutation({
    mutationFn: createPtAssistRequest,
    onSuccess: async (response) => {
      Toast.show({
        type: "success",
        text1: "Tạo lịch PT thành công",
        text2: response.message,
      });
      setSelectedPackage(null);
      setSelectedPtId("");
      setSelectedCell(null);
      setWeekStart(getIsoWeekStart(new Date()));
      setNote("");
      await refetch();
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Không thể tạo lịch PT",
        text2: error?.response?.data?.message || "Vui lòng thử lại sau.",
      });
    },
  });

  const handleOpenPtRequestModal = (item: MyPurchasePackage) => {
    setSelectedPackage(item);
    setSelectedPtId("");
    setSelectedCell(null);
    setWeekStart(getIsoWeekStart(new Date()));
    setNote("");
  };

  const handleClosePtRequestModal = () => {
    if (ptRequestMutation.isPending) {
      return;
    }

    setSelectedPackage(null);
    setSelectedPtId("");
    setSelectedCell(null);
    setWeekStart(getIsoWeekStart(new Date()));
  };

  const handleCreatePtRequest = () => {
    if (!selectedPackage || !selectedCell) {
      Toast.show({
        type: "error",
        text1: "Vui lòng chọn PT và khung giờ",
      });
      return;
    }

    ptRequestMutation.mutate({
      userPackageId: selectedPackage.id,
      slotId: selectedCell.weeklySlotId,
      sessionDate: selectedCell.sessionDate,
      note: note.trim() || undefined,
    });
  };
  const availablePts = useMemo<AvailablePtAccount[]>(() => availablePtData?.data ?? [], [
    availablePtData,
  ]);
  const selectedPt = useMemo(
    () => availablePts.find((item) => item.id === selectedPtId) ?? null,
    [availablePts, selectedPtId],
  );
  const weekDays = weekGridData?.data?.days ?? [];
  const weekRows = weekGridData?.data?.gridRows ?? [];

  useEffect(() => {
    setSelectedCell(null);
  }, [selectedPtId, weekStart]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarBox}>
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={32}
                  color="#08110A"
                />
              </View>

              <View>
                <Text style={styles.greeting}>Xin chào 👋</Text>
                <Text style={styles.userName}>
                  {user?.email?.split("@")[0] || "Người dùng"}
                </Text>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable style={styles.actionButton}>
                <Ionicons name="search-outline" size={28} color="#8A93A5" />
              </Pressable>

              <Pressable style={styles.actionButton}>
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color="#8A93A5"
                />
                <View style={styles.notificationDot} />
              </Pressable>
            </View>
          </View>

          <View style={styles.contractSection}>
            {isPt ? (
              isLoadingPtSchedule ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#22C55E" />
                </View>
              ) : upcomingPtSchedules.length ? (
                <FlatList
                  data={upcomingPtSchedules}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const statusColor = getPtScheduleStatusColor(item.extendedProps.status);

                    return (
                      <View style={styles.ptScheduleCard}>
                        <View style={styles.ptScheduleHeader}>
                          <Text style={styles.ptScheduleTitle}>Lịch hẹn tập</Text>
                          <View
                            style={[
                              styles.ptScheduleStatusBadge,
                              { backgroundColor: `${statusColor}22` },
                            ]}
                          >
                            <Text
                              style={[
                                styles.ptScheduleStatusText,
                                { color: statusColor },
                              ]}
                            >
                              {getPtScheduleStatusLabel(item.extendedProps.status)}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.ptScheduleName}>{getTraineeName(item)}</Text>
                        <Text style={styles.ptSchedulePackage}>
                          {item.extendedProps.userPackage.package.name}
                        </Text>

                        <View style={styles.ptScheduleDetailRow}>
                          <Ionicons name="time-outline" size={18} color="#22C55E" />
                          <Text style={styles.ptScheduleDetailText}>
                            {formatPtScheduleTime(item.start, item.end)}
                          </Text>
                        </View>

                        <View style={styles.ptScheduleDetailRow}>
                          <Ionicons name="location-outline" size={18} color="#22C55E" />
                          <Text style={styles.ptScheduleDetailText}>
                            {item.extendedProps.branch.name}
                          </Text>
                        </View>

                        {item.extendedProps.note ? (
                          <Text style={styles.ptScheduleNote} numberOfLines={2}>
                            Ghi chú: {item.extendedProps.note}
                          </Text>
                        ) : null}
                      </View>
                    );
                  }}
                  contentContainerStyle={styles.contractListContent}
                />
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Lịch hẹn tập</Text>
                  <Text style={styles.emptyText}>
                    Bạn chưa có lịch hẹn với trainee trong thời gian tới
                  </Text>
                </View>
              )
            ) : isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#22C55E" />
              </View>
            ) : (
              <FlatList
                data={purchasePackages}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <PackageContractCard
                    item={item}
                    onRequestPt={handleOpenPtRequestModal}
                  />
                )}
                contentContainerStyle={styles.contractListContent}
                ListEmptyComponent={
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>Hợp đồng</Text>
                    <Text style={styles.emptyText}>
                      Bạn chưa có gói tập nào
                    </Text>
                  </View>
                }
              />
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <Pressable>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>

          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <CategoryItem
                title={item.title}
                icon={item.icon}
                active={item.active}
              />
            )}
            contentContainerStyle={styles.horizontalListContent}
          />

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bài tập nổi bật</Text>
            <Pressable>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </Pressable>
          </View>

          <FlatList
            data={featuredWorkouts}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <FeaturedWorkoutCard
                title={item.title}
                category={item.category}
                image={item.image}
              />
            )}
            contentContainerStyle={styles.horizontalListContent}
          />

          {isRefetching && (
            <Text style={styles.refreshText}>Đang cập nhật dữ liệu...</Text>
          )}
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={!!selectedPackage}
        onRequestClose={handleClosePtRequestModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Đặt lịch với PT</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedPackage?.package.name || "Chọn thời gian tập luyện"}
                </Text>
              </View>

              <Pressable onPress={handleClosePtRequestModal} style={styles.closeButton}>
                <Ionicons name="close" size={22} color="#F8FAFC" />
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Chọn huấn luyện viên</Text>
            {isLoadingPts ? (
              <View style={styles.slotLoadingBox}>
                <ActivityIndicator color="#22C55E" />
                <Text style={styles.slotLoadingText}>Đang tải danh sách PT...</Text>
              </View>
            ) : availablePts.length ? (
              <View style={styles.slotList}>
                {availablePts.map((pt) => {
                  const isActive = pt.id === selectedPtId;
                  const totalSlots = (pt.ptAvailabilityWindows ?? []).reduce(
                    (acc, win) => acc + (win.weeklySlots?.length ?? 0),
                    0,
                  );
                  return (
                    <Pressable
                      key={pt.id}
                      onPress={() => {
                        setSelectedPtId(pt.id);
                      }}
                      style={[styles.slotCard, isActive && styles.slotCardActive]}
                    >
                      <View style={styles.slotCardHeader}>
                        <Text style={[styles.slotDate, isActive && styles.slotDateActive]}>
                          {pt.profile?.name || pt.email}
                        </Text>
                      </View>
                      <Text style={[styles.slotTime, isActive && styles.slotTimeActive]}>
                        {pt.email}
                      </Text>
                      <Text style={[styles.slotBranch, isActive && styles.slotBranchActive]}>
                        {totalSlots} khung giờ / tuần
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={styles.slotEmptyBox}>
                <Text style={styles.slotEmptyText}>
                  Chưa có PT khả dụng cho chi nhánh này.
                </Text>
              </View>
            )}

            {selectedPt ? (
              <>
                <View style={styles.weekHeader}>
                  <Text style={styles.inputLabel}>Chọn khung giờ trong tuần</Text>
                  <View style={styles.weekActions}>
                    <Pressable
                      style={styles.weekNavButton}
                      onPress={() => {
                        const prev = parseYmdToLocalDate(weekStart);
                        if (!prev) {
                          return;
                        }
                        prev.setDate(prev.getDate() - 7);
                        const minWeek = getIsoWeekStart(new Date());
                        const prevWeekStart = getIsoWeekStart(prev);
                        if (prevWeekStart >= minWeek) {
                          setWeekStart(prevWeekStart);
                        }
                      }}
                    >
                      <Ionicons name="chevron-back" size={16} color="#F8FAFC" />
                    </Pressable>
                    <Pressable
                      style={styles.weekNavButton}
                      onPress={() => {
                        const next = parseYmdToLocalDate(weekStart);
                        if (!next) {
                          return;
                        }
                        next.setDate(next.getDate() + 7);
                        setWeekStart(getIsoWeekStart(next));
                      }}
                    >
                      <Ionicons name="chevron-forward" size={16} color="#F8FAFC" />
                    </Pressable>
                  </View>
                </View>

                {isLoadingWeekGrid ? (
                  <View style={styles.slotLoadingBox}>
                    <ActivityIndicator color="#22C55E" />
                    <Text style={styles.slotLoadingText}>Đang tải lịch tuần...</Text>
                  </View>
                ) : weekDays.length && weekRows.length ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.weekGridWrap}>
                      <View style={styles.weekDayHeaderRow}>
                        {weekDays.map((day) => (
                          <View key={day.date} style={styles.weekDayHeaderCell}>
                            <Text style={styles.weekDayText}>
                              {DAY_OF_WEEK_LABELS[day.dayOfWeek]}
                            </Text>
                            <Text style={styles.weekDateText}>
                              {new Date(`${day.date}T00:00:00.000Z`).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </Text>
                          </View>
                        ))}
                      </View>
                      {weekRows.map((row) => (
                        <View key={row.key} style={styles.weekSlotRow}>
                          {weekDays.map((day) => {
                            const cell = day.slots.find((s) => s.gridKey === row.key);
                            const isFree = cell?.state === "FREE" && !!cell.weeklySlotId;
                            const isActive =
                              !!cell &&
                              !!selectedCell &&
                              selectedCell.weeklySlotId === cell.weeklySlotId &&
                              selectedCell.sessionDate === day.date;
                            const cellStyle = [
                              styles.weekSlotCell,
                              isFree ? styles.weekSlotCellFree : styles.weekSlotCellDisabled,
                              isActive && styles.weekSlotCellActive,
                            ];

                            return (
                              <Pressable
                                key={`${row.key}-${day.date}`}
                                style={cellStyle}
                                disabled={!isFree}
                                onPress={() => {
                                  if (!isFree || !cell) {
                                    return;
                                  }
                                  setSelectedCell({
                                    weeklySlotId: cell.weeklySlotId as string,
                                    sessionDate: day.date,
                                    startTime: cell.startTime,
                                    endTime: cell.endTime,
                                  });
                                }}
                              >
                                <Text style={styles.weekSlotTimeText}>
                                  {formatSlotTimeLabel(row.startTime, row.endTime)}
                                </Text>
                                <Text style={styles.weekSlotStatusText}>
                                  {cell?.state === "FREE"
                                    ? "TRỐNG"
                                    : cell?.state === "OCCUPIED"
                                      ? "ĐÃ ĐẶT"
                                      : cell?.state === "PASSED"
                                        ? "ĐÃ QUA"
                                        : "—"}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                ) : (
                  <View style={styles.slotEmptyBox}>
                    <Text style={styles.slotEmptyText}>
                      PT chưa mở lịch tuần cho giai đoạn này.
                    </Text>
                  </View>
                )}
              </>
            ) : null}

            {selectedCell ? (
              <View style={styles.selectedCellBox}>
                <Text style={styles.selectedCellText}>
                  Đã chọn:{" "}
                  {new Date(`${selectedCell.sessionDate}T00:00:00.000Z`).toLocaleDateString(
                    "vi-VN",
                    { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" },
                  )}{" "}
                  • {formatSlotTimeLabel(selectedCell.startTime, selectedCell.endTime)}
                </Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Ghi chú</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ví dụ: muốn tập phần thân trên"
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              style={styles.noteInput}
            />

            <Text style={styles.helperText}>
              Chỉ có thể đặt lịch theo các ca dạy PT đã mở từ hệ thống.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                onPress={handleClosePtRequestModal}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Đóng</Text>
              </Pressable>

              <Pressable
                onPress={handleCreatePtRequest}
                style={[
                  styles.primaryButton,
                  ptRequestMutation.isPending && styles.primaryButtonDisabled,
                ]}
                disabled={ptRequestMutation.isPending}
              >
                {ptRequestMutation.isPending ? (
                  <ActivityIndicator color="#08110A" />
                ) : (
                  <Text style={styles.primaryButtonText}>Tạo yêu cầu</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020817",
  },
  contentContainer: {
    paddingTop: 18,
    paddingBottom: 28,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  greeting: {
    color: "#8A93A5",
    fontSize: 18,
    marginBottom: 4,
  },
  userName: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    maxWidth: 180,
  },
  headerActions: {
    flexDirection: "row",
    gap: 14,
  },
  actionButton: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: "#1A2332",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#EF4444",
    position: "absolute",
    top: 18,
    right: 18,
  },
  contractSection: {
    marginBottom: 30,
  },
  contractListContent: {
    paddingLeft: 24,
    paddingRight: 8,
  },
  loadingBox: {
    height: 240,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCard: {
    marginHorizontal: 24,
    width: 360,
    borderRadius: 28,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 24,
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  emptyText: {
    color: "#8A93A5",
    fontSize: 16,
  },
  ptScheduleCard: {
    width: 340,
    marginLeft: 24,
    marginRight: 8,
    borderRadius: 28,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
  },
  ptScheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  ptScheduleTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
  },
  ptScheduleStatusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ptScheduleStatusText: {
    fontSize: 12,
    fontWeight: "800",
  },
  ptScheduleName: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 6,
  },
  ptSchedulePackage: {
    color: "#CBD5E1",
    fontSize: 14,
    marginBottom: 16,
  },
  ptScheduleDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  ptScheduleDetailText: {
    flex: 1,
    color: "#CBD5E1",
    fontSize: 14,
    lineHeight: 20,
  },
  ptScheduleNote: {
    marginTop: 6,
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
  },
  seeAll: {
    color: "#19F07C",
    fontSize: 18,
    fontWeight: "700",
  },
  horizontalListContent: {
    paddingLeft: 24,
    paddingRight: 8,
    marginBottom: 28,
  },
  refreshText: {
    color: "#8A93A5",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,8,23,0.72)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#101826",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
  },
  modalTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1A2332",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },
  horizontalSelectorContent: {
    paddingBottom: 14,
    paddingRight: 8,
  },
  selectorChip: {
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  selectorChipActive: {
    backgroundColor: "#22C55E",
  },
  selectorChipText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "700",
  },
  selectorChipTextActive: {
    color: "#08110A",
  },
  durationRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  durationChip: {
    flex: 1,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
  },
  durationChipActive: {
    backgroundColor: "#22C55E",
  },
  durationChipText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "700",
  },
  durationChipTextActive: {
    color: "#08110A",
  },
  slotLoadingBox: {
    borderRadius: 16,
    backgroundColor: "#182235",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    gap: 8,
  },
  slotLoadingText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  slotList: {
    maxHeight: 260,
    marginBottom: 14,
    gap: 10,
  },
  slotCard: {
    borderRadius: 16,
    backgroundColor: "#182235",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 12,
  },
  slotCardActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  slotCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  slotDate: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },
  slotDateActive: {
    color: "#BBF7D0",
  },
  slotSeats: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  slotSeatsActive: {
    color: "#DCFCE7",
  },
  slotTime: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  slotTimeActive: {
    color: "#F0FDF4",
  },
  slotBranch: {
    color: "#94A3B8",
    fontSize: 12,
  },
  slotBranchActive: {
    color: "#DCFCE7",
  },
  slotNote: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18,
  },
  slotNoteActive: {
    color: "#DCFCE7",
  },
  slotEmptyBox: {
    borderRadius: 16,
    backgroundColor: "#182235",
    padding: 14,
    marginBottom: 14,
  },
  slotEmptyText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weekActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  weekNavButton: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#1A2332",
    alignItems: "center",
    justifyContent: "center",
  },
  weekGridWrap: {
    marginBottom: 14,
    gap: 8,
  },
  weekDayHeaderRow: {
    flexDirection: "row",
    gap: 8,
  },
  weekDayHeaderCell: {
    width: 94,
    borderRadius: 12,
    backgroundColor: "#182235",
    paddingVertical: 8,
    alignItems: "center",
  },
  weekDayText: {
    color: "#F8FAFC",
    fontSize: 12,
    fontWeight: "800",
  },
  weekDateText: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 3,
  },
  weekSlotRow: {
    flexDirection: "row",
    gap: 8,
  },
  weekSlotCell: {
    width: 94,
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  weekSlotCellFree: {
    borderColor: "#334155",
    backgroundColor: "#0F172A",
  },
  weekSlotCellDisabled: {
    borderColor: "rgba(148,163,184,0.2)",
    backgroundColor: "#111827",
    opacity: 0.6,
  },
  weekSlotCellActive: {
    borderColor: "#22C55E",
    backgroundColor: "rgba(34,197,94,0.16)",
  },
  weekSlotTimeText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  weekSlotStatusText: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  selectedCellBox: {
    borderRadius: 14,
    backgroundColor: "rgba(34,197,94,0.12)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.45)",
    padding: 10,
    marginBottom: 10,
  },
  selectedCellText: {
    color: "#DCFCE7",
    fontSize: 12,
    lineHeight: 18,
  },
  noteInput: {
    minHeight: 88,
    borderRadius: 18,
    backgroundColor: "#182235",
    color: "#F8FAFC",
    paddingHorizontal: 14,
    paddingVertical: 12,
    textAlignVertical: "top",
    marginBottom: 10,
    fontSize: 14,
  },
  helperText: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  primaryButton: {
    flex: 1,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#08110A",
    fontSize: 15,
    fontWeight: "800",
  },
});
