import PackageContractCard from "@/components/card/PackageContractCard";
import CategoryItem from "@/components/home/CategoryItem";
import FeaturedWorkoutCard from "@/components/home/FeaturedWorkoutCard";
import { createPtAssistRequest, getPTAssistSchedule } from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import { useMyPurchasePackages } from "@/stores/useMyPurchasePackages";
import { MyPurchasePackage, PTAssistSchedule } from "@/types/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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

const durationOptions = [30, 60, 90];
const timeSlotOptions = Array.from({ length: 15 }, (_, index) => {
  const hour = index + 6;
  return `${String(hour).padStart(2, "0")}:00`;
});

const getUpcomingDateOptions = (days = 7) =>
  Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);

    return {
      value: date.toISOString().split("T")[0],
      label: date.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }),
    };
  });

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
  const upcomingDateOptions = useMemo(() => getUpcomingDateOptions(), []);
  const [selectedDate, setSelectedDate] = useState(upcomingDateOptions[0]?.value ?? "");
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [note, setNote] = useState("");

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
    setSelectedDate(upcomingDateOptions[0]?.value ?? "");
    setSelectedTime("09:00");
    setSelectedDuration(60);
    setNote("");
  };

  const handleClosePtRequestModal = () => {
    if (ptRequestMutation.isPending) {
      return;
    }

    setSelectedPackage(null);
  };

  const handleCreatePtRequest = () => {
    if (!selectedPackage || !selectedDate || !selectedTime) {
      return;
    }

    const startTime = new Date(`${selectedDate}T${selectedTime}:00`);
    const endTime = new Date(startTime.getTime() + selectedDuration * 60 * 1000);

    ptRequestMutation.mutate({
      userPackageId: selectedPackage.id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      note: note.trim() || undefined,
    });
  };

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

            <Text style={styles.inputLabel}>Chọn ngày</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalSelectorContent}
            >
              {upcomingDateOptions.map((item) => {
                const isActive = item.value === selectedDate;

                return (
                  <Pressable
                    key={item.value}
                    onPress={() => setSelectedDate(item.value)}
                    style={[styles.selectorChip, isActive && styles.selectorChipActive]}
                  >
                    <Text
                      style={[
                        styles.selectorChipText,
                        isActive && styles.selectorChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>Giờ bắt đầu</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalSelectorContent}
            >
              {timeSlotOptions.map((time) => {
                const isActive = time === selectedTime;

                return (
                  <Pressable
                    key={time}
                    onPress={() => setSelectedTime(time)}
                    style={[styles.selectorChip, isActive && styles.selectorChipActive]}
                  >
                    <Text
                      style={[
                        styles.selectorChipText,
                        isActive && styles.selectorChipTextActive,
                      ]}
                    >
                      {time}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.inputLabel}>Thời lượng buổi tập</Text>
            <View style={styles.durationRow}>
              {durationOptions.map((duration) => {
                const isActive = duration === selectedDuration;

                return (
                  <Pressable
                    key={duration}
                    onPress={() => setSelectedDuration(duration)}
                    style={[
                      styles.durationChip,
                      isActive && styles.durationChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationChipText,
                        isActive && styles.durationChipTextActive,
                      ]}
                    >
                      {duration} phút
                    </Text>
                  </Pressable>
                );
              })}
            </View>

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
              Yêu cầu sẽ được gửi tới PT đã gán sẵn cho gói tập này.
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
