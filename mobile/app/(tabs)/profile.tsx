import { APP_ROUTES } from "@/constants/appRoute";
import {
  getCheckInHistory,
  getPTTrainingHistory,
  getProfile,
  getTodayExercise,
  updateProfile,
} from "@/services/api";
import { useAuthStore } from "@/stores/auth.store";
import {
  CheckInHistoryResponse,
  Profile,
  ProfileResponse,
  PTTrainingHistoriesResponse,
  PTTrainingHistory,
  TodayExcerciseResponse,
  UpdateProfileRequest,
} from "@/types/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
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

type EditFormState = {
  name: string;
  phone: string;
  avatar: string;
  dateOfBirth: string;
  height: string;
  weight: string;
  gender: "" | "MALE" | "FEMALE";
  fitnessGoal:
    | ""
    | "LOSE_WEIGHT"
    | "GAIN_MUSCLE"
    | "IMPROVE_HEALTH"
    | "MAINTAIN_WEIGHT";
};

const formatDate = (value?: string | null) => {
  if (!value) return "Dang cap nhat";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Dang cap nhat";
  return date.toLocaleDateString("vi-VN");
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "Dang cap nhat";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Dang cap nhat";
  return date.toLocaleString("vi-VN");
};

const normalizeDateKey = (key: string): string => {
  const slice = key.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(slice)) return slice;
  const date = new Date(key);
  if (Number.isNaN(date.getTime())) return slice;
  return date.toISOString().slice(0, 10);
};

const totalCheckInsFromGrouped = (raw: Record<string, { id: string }[]>) =>
  Object.values(raw).reduce((count, items) => count + items.length, 0);

const computeCheckInStreak = (raw: Record<string, { id: string }[]>) => {
  const keys = Object.keys(raw).map(normalizeDateKey);
  if (!keys.length) return 0;

  const set = new Set(keys);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  const todayKey = start.toISOString().slice(0, 10);
  if (!set.has(todayKey)) {
    start.setDate(start.getDate() - 1);
  }

  if (!set.has(start.toISOString().slice(0, 10))) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(start);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const bmiLabel = (bmi: number) => {
  if (bmi < 18.5) return "Thieu can";
  if (bmi < 25) return "Binh thuong";
  if (bmi < 30) return "Thua can";
  return "Beo phi";
};

const genderLabel = (gender?: string | null) => {
  if (gender === "MALE") return "Nam";
  if (gender === "FEMALE") return "Nu";
  return "Dang cap nhat";
};

const fitnessGoalLabel = (goal?: string | null) => {
  switch (goal) {
    case "LOSE_WEIGHT":
      return "Giam can";
    case "GAIN_MUSCLE":
      return "Tang co";
    case "IMPROVE_HEALTH":
      return "Cai thien suc khoe";
    case "MAINTAIN_WEIGHT":
      return "Duy tri can nang";
    default:
      return "Dang cap nhat";
  }
};

const buildEditForm = (profile: Profile): EditFormState => ({
  name: profile.name ?? "",
  phone: profile.phone ?? "",
  avatar: profile.avatar ?? "",
  dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
  height: profile.height != null ? String(profile.height) : "",
  weight: profile.weight != null ? String(profile.weight) : "",
  gender: profile.gender ?? "",
  fitnessGoal: profile.fitnessGoal ?? "",
});

const getInitials = (profile?: Profile) => {
  const name = profile?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return profile?.email?.slice(0, 2).toUpperCase() ?? "BG";
};

function StatCard({
  icon,
  value,
  label,
  accent = "#22C55E",
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent?: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${accent}20` }]}>{icon}</View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditFormState>({
    name: "",
    phone: "",
    avatar: "",
    dateOfBirth: "",
    height: "",
    weight: "",
    gender: "",
    fitnessGoal: "",
  });

  const { data: profileRes, isLoading: profileLoading, isError: profileError } = useQuery<ProfileResponse>({
    queryKey: ["account-profile"],
    queryFn: getProfile,
    enabled: !!accessToken,
  });

  const { data: checkInRes } = useQuery<CheckInHistoryResponse>({
    queryKey: ["profile-checkins"],
    queryFn: getCheckInHistory,
    enabled: !!accessToken,
  });

  const { data: ptHistoryRes } = useQuery<PTTrainingHistoriesResponse>({
    queryKey: ["profile-pt-history"],
    queryFn: () => getPTTrainingHistory(),
    enabled: !!accessToken && user?.role === "USER",
  });

  const { data: todayExerciseRes } = useQuery<TodayExcerciseResponse>({
    queryKey: ["profile-today-exercises"],
    queryFn: getTodayExercise,
    enabled: !!accessToken && user?.role === "USER",
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-profile"] });
      setEditOpen(false);
      Toast.show({
        type: "success",
        text1: "Da cap nhat ho so",
      });
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "Cap nhat that bai",
        text2: "Vui long thu lai sau.",
      });
    },
  });

  const profile = profileRes?.data;
  const checkInGrouped = (checkInRes?.data ?? {}) as Record<string, { id: string }[]>;
  const totalCheckIns = useMemo(
    () => totalCheckInsFromGrouped(checkInGrouped),
    [checkInGrouped],
  );
  const checkInStreak = useMemo(
    () => computeCheckInStreak(checkInGrouped),
    [checkInGrouped],
  );
  const ptSessions = useMemo(() => {
    const list = (ptHistoryRes?.data ?? []) as PTTrainingHistory[];
    return [...list].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [ptHistoryRes?.data]);
  const ptAcceptedCount = useMemo(
    () => ptSessions.filter((item) => item.status === "ACCEPTED").length,
    [ptSessions],
  );
  const recentPtSessions = useMemo(() => ptSessions.slice(0, 4), [ptSessions]);
  const todayExercise = todayExerciseRes?.data ?? null;

  const bmi = useMemo(() => {
    if (!profile?.height || !profile?.weight) return null;
    return profile.weight / Math.pow(profile.height / 100, 2);
  }, [profile?.height, profile?.weight]);

  const displayName =
    profile?.name?.trim() || profile?.email?.split("@")[0] || user?.email || "Thanh vien";

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login");
  };

  const openEditModal = () => {
    if (!profile) return;
    setForm(buildEditForm(profile));
    setEditOpen(true);
  };

  const handleSaveProfile = () => {
    const payload: UpdateProfileRequest = {};

    if (form.name.trim()) payload.name = form.name.trim();
    if (form.phone.trim()) payload.phone = form.phone.trim();
    if (form.avatar.trim()) payload.avatar = form.avatar.trim();
    if (form.gender) payload.gender = form.gender;
    if (form.fitnessGoal) payload.fitnessGoal = form.fitnessGoal;

    if (form.height.trim()) {
      const height = Number(form.height);
      if (Number.isNaN(height)) {
        Toast.show({ type: "error", text1: "Chieu cao khong hop le" });
        return;
      }
      payload.height = height;
    }

    if (form.weight.trim()) {
      const weight = Number(form.weight);
      if (Number.isNaN(weight)) {
        Toast.show({ type: "error", text1: "Can nang khong hop le" });
        return;
      }
      payload.weight = weight;
    }

    if (form.dateOfBirth.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth.trim())) {
        Toast.show({
          type: "error",
          text1: "Ngay sinh khong hop le",
          text2: "Nhap theo dinh dang YYYY-MM-DD",
        });
        return;
      }
      payload.dateOfBirth = new Date(`${form.dateOfBirth.trim()}T00:00:00`).toISOString();
    }

    updateProfileMutation.mutate(payload);
  };

  const openTodayWorkout = () => {
    const programId = todayExercise?.programDay?.programId;
    const dayId = todayExercise?.programDay?.id;
    if (!programId || !dayId) return;
    router.push({
      pathname: APP_ROUTES.PROGRAM_SESSION,
      params: { programId, dayId },
    });
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.stateText}>Dang tai thong tin tai khoan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileError || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>Khong tai duoc ho so</Text>
          <Text style={styles.stateText}>Vui long thu lai sau.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Tai khoan</Text>
            <Text style={styles.screenSubtitle}>Quan ly thong tin va tien do tap luyen cua ban.</Text>
          </View>
          <Pressable style={styles.editHeaderButton} onPress={openEditModal}>
            <Ionicons name="create-outline" size={20} color="#F8FAFC" />
          </Pressable>
        </View>

        <View style={styles.profileHero}>
          <View style={styles.profileTopRow}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{getInitials(profile)}</Text>
              </View>
            )}

            <View style={styles.profileMeta}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
              <Text style={styles.profileSince}>
                Thanh vien tu {formatDate(profile.createdAt)}
              </Text>
            </View>
          </View>

          <Pressable style={styles.primaryAction} onPress={openEditModal}>
            <Text style={styles.primaryActionText}>Cap nhat ho so</Text>
          </Pressable>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon={<Ionicons name="calendar-outline" size={20} color="#22C55E" />}
            value={String(totalCheckIns)}
            label="Luot check-in"
          />
          <StatCard
            icon={<Ionicons name="flame-outline" size={20} color="#F97316" />}
            value={`${checkInStreak}`}
            label="Ngay lien tiep"
            accent="#F97316"
          />
          <StatCard
            icon={<MaterialCommunityIcons name="dumbbell" size={20} color="#A855F7" />}
            value={String(user?.role === "USER" ? ptAcceptedCount : 0)}
            label="Buoi PT"
            accent="#A855F7"
          />
          <StatCard
            icon={<Ionicons name="analytics-outline" size={20} color="#38BDF8" />}
            value={bmi ? bmi.toFixed(1) : "--"}
            label={bmi ? bmiLabel(bmi) : "BMI"}
            accent="#38BDF8"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lich tap hom nay</Text>
          {user?.role !== "USER" ? (
            <Text style={styles.mutedText}>Dang cap nhat</Text>
          ) : !todayExercise?.programDay || !todayExercise.exercises?.length ? (
            <Text style={styles.mutedText}>Hom nay ban chua co bai tap.</Text>
          ) : (
            <View>
              <View style={styles.todaySummary}>
                <Text style={styles.todayTitle}>{todayExercise.programDay.title}</Text>
                <Text style={styles.todayNote}>
                  {todayExercise.programDay.note || "San sang cho buoi tap hom nay."}
                </Text>
              </View>

              {todayExercise.exercises.slice(0, 3).map((item) => (
                <View key={item.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseIndex}>
                    <Text style={styles.exerciseIndexText}>{item.sortOrder}</Text>
                  </View>
                  <View style={styles.exerciseContent}>
                    <Text style={styles.exerciseName}>{item.exercise.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {item.exercise.muscleGroup} • {item.exercise.level}
                    </Text>
                  </View>
                </View>
              ))}

              <Pressable style={styles.secondaryAction} onPress={openTodayWorkout}>
                <Text style={styles.secondaryActionText}>Bat dau tap ngay</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thong tin ca nhan</Text>
          <InfoRow label="Ho ten" value={profile.name?.trim() || "Dang cap nhat"} />
          <InfoRow label="Email" value={profile.email} />
          <InfoRow label="So dien thoai" value={profile.phone?.trim() || "Dang cap nhat"} />
          <InfoRow label="Gioi tinh" value={genderLabel(profile.gender)} />
          <InfoRow label="Ngay sinh" value={formatDate(profile.dateOfBirth)} />
          <InfoRow
            label="Chieu cao"
            value={profile.height != null ? `${profile.height} cm` : "Dang cap nhat"}
          />
          <InfoRow
            label="Can nang"
            value={profile.weight != null ? `${profile.weight} kg` : "Dang cap nhat"}
          />
          <InfoRow label="Muc tieu" value={fitnessGoalLabel(profile.fitnessGoal)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Buoi tap voi PT gan day</Text>
          {user?.role !== "USER" ? (
            <Text style={styles.mutedText}>Dang cap nhat</Text>
          ) : recentPtSessions.length === 0 ? (
            <Text style={styles.mutedText}>Chua co lich su buoi PT.</Text>
          ) : (
            recentPtSessions.map((session) => (
              <View key={session.id} style={styles.ptItem}>
                <View style={styles.ptItemContent}>
                  <Text style={styles.ptPackageName}>{session.userPackage.package.name}</Text>
                  <Text style={styles.ptMeta}>
                    {formatDateTime(session.startTime)} • {session.branch.name}
                  </Text>
                </View>
                <View style={styles.ptStatusChip}>
                  <Text style={styles.ptStatusText}>
                    {session.status === "ACCEPTED"
                      ? "Da xac nhan"
                      : session.status === "PENDING"
                        ? "Cho xac nhan"
                        : session.status === "REJECTED"
                          ? "Tu choi"
                          : session.status === "CANCELLED"
                            ? "Da huy"
                            : session.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Tac vu</Text>
          <Pressable style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F8FAFC" />
            <Text style={styles.logoutText}>Dang xuat</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={editOpen} transparent animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cap nhat thong tin</Text>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalContent}>
              <Text style={styles.inputLabel}>Ho ten</Text>
              <TextInput
                value={form.name}
                onChangeText={(value) => setForm((prev) => ({ ...prev, name: value }))}
                placeholder="Nguyen Van A"
                placeholderTextColor="#64748B"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>So dien thoai</Text>
              <TextInput
                value={form.phone}
                onChangeText={(value) => setForm((prev) => ({ ...prev, phone: value }))}
                placeholder="09xxxxxxxx"
                placeholderTextColor="#64748B"
                style={styles.input}
                keyboardType="phone-pad"
              />

              <Text style={styles.inputLabel}>Avatar URL</Text>
              <TextInput
                value={form.avatar}
                onChangeText={(value) => setForm((prev) => ({ ...prev, avatar: value }))}
                placeholder="https://..."
                placeholderTextColor="#64748B"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Ngay sinh</Text>
              <TextInput
                value={form.dateOfBirth}
                onChangeText={(value) => setForm((prev) => ({ ...prev, dateOfBirth: value }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#64748B"
                style={styles.input}
              />

              <View style={styles.doubleRow}>
                <View style={styles.doubleField}>
                  <Text style={styles.inputLabel}>Chieu cao (cm)</Text>
                  <TextInput
                    value={form.height}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, height: value }))}
                    placeholder="170"
                    placeholderTextColor="#64748B"
                    style={styles.input}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.doubleField}>
                  <Text style={styles.inputLabel}>Can nang (kg)</Text>
                  <TextInput
                    value={form.weight}
                    onChangeText={(value) => setForm((prev) => ({ ...prev, weight: value }))}
                    placeholder="65"
                    placeholderTextColor="#64748B"
                    style={styles.input}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Gioi tinh</Text>
              <View style={styles.chipRow}>
                {[
                  { id: "", label: "Bo trong" },
                  { id: "MALE", label: "Nam" },
                  { id: "FEMALE", label: "Nu" },
                ].map((item) => {
                  const isActive = form.gender === item.id;
                  return (
                    <Pressable
                      key={item.id || "empty-gender"}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          gender: item.id as EditFormState["gender"],
                        }))
                      }
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Muc tieu</Text>
              <View style={styles.chipRow}>
                {[
                  { id: "", label: "Bo trong" },
                  { id: "LOSE_WEIGHT", label: "Giam can" },
                  { id: "GAIN_MUSCLE", label: "Tang co" },
                  { id: "IMPROVE_HEALTH", label: "Suc khoe" },
                  { id: "MAINTAIN_WEIGHT", label: "Duy tri" },
                ].map((item) => {
                  const isActive = form.fitnessGoal === item.id;
                  return (
                    <Pressable
                      key={item.id || "empty-goal"}
                      style={[styles.chip, isActive && styles.chipActive]}
                      onPress={() =>
                        setForm((prev) => ({
                          ...prev,
                          fitnessGoal: item.id as EditFormState["fitnessGoal"],
                        }))
                      }
                    >
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondaryButton} onPress={() => setEditOpen(false)}>
                <Text style={styles.modalSecondaryText}>Huy</Text>
              </Pressable>
              <Pressable
                style={styles.modalPrimaryButton}
                onPress={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator color="#08110A" />
                ) : (
                  <Text style={styles.modalPrimaryText}>Luu</Text>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateText: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 12,
  },
  errorTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },
  screenTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 6,
  },
  screenSubtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 260,
  },
  editHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  profileHero: {
    borderRadius: 28,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    marginBottom: 16,
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 18,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#182235",
  },
  avatarFallback: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    color: "#08110A",
    fontSize: 24,
    fontWeight: "900",
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  profileEmail: {
    color: "#CBD5E1",
    fontSize: 14,
    marginBottom: 8,
  },
  profileSince: {
    color: "#94A3B8",
    fontSize: 12,
  },
  primaryAction: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: {
    color: "#08110A",
    fontSize: 15,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    borderRadius: 22,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  statIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    marginBottom: 16,
  },
  cardTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },
  mutedText: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
  },
  todaySummary: {
    borderRadius: 18,
    backgroundColor: "#182235",
    padding: 14,
    marginBottom: 12,
  },
  todayTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  todayNote: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 19,
  },
  exerciseRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  exerciseIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseIndexText: {
    color: "#F8FAFC",
    fontSize: 13,
    fontWeight: "800",
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  exerciseMeta: {
    color: "#94A3B8",
    fontSize: 12,
  },
  secondaryAction: {
    marginTop: 14,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#A435F0",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryActionText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  infoRow: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  infoLabel: {
    color: "#94A3B8",
    fontSize: 12,
    marginBottom: 4,
  },
  infoValue: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "600",
  },
  ptItem: {
    borderRadius: 18,
    backgroundColor: "#182235",
    padding: 14,
    marginBottom: 10,
  },
  ptItemContent: {
    marginBottom: 10,
  },
  ptPackageName: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  ptMeta: {
    color: "#94A3B8",
    fontSize: 12,
    lineHeight: 18,
  },
  ptStatusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#0F172A",
  },
  ptStatusText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },
  logoutButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#DC2626",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2,8,23,0.72)",
    justifyContent: "flex-end",
  },
  modalCard: {
    maxHeight: "88%",
    backgroundColor: "#101826",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },
  modalTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  modalContent: {
    paddingBottom: 8,
  },
  inputLabel: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#182235",
    color: "#F8FAFC",
    paddingHorizontal: 14,
    fontSize: 14,
  },
  doubleRow: {
    flexDirection: "row",
    gap: 12,
  },
  doubleField: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#182235",
  },
  chipActive: {
    backgroundColor: "#22C55E",
  },
  chipText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
  },
  chipTextActive: {
    color: "#08110A",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  modalSecondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },
  modalPrimaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryText: {
    color: "#08110A",
    fontSize: 14,
    fontWeight: "800",
  },
});
