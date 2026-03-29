import { APP_ROUTES } from "@/constants/appRoute";
import { getPrograms } from "@/services/api";
import { Exercise, Program, ProgramDay } from "@/types/types";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const durationOptions = [30, 45, 60];

const getStringParam = (param?: string | string[]) =>
  Array.isArray(param) ? (param[0] ?? "") : (param ?? "");

const getLevelLabel = (level: Program["level"] | Exercise["level"]) => {
  switch (level) {
    case "BEGINNER":
      return "Cơ bản";
    case "INTERMEDIATE":
      return "Trung cấp";
    case "ADVANCED":
      return "Nâng cao";
    default:
      return level;
  }
};

const getMuscleGroupLabel = (muscleGroup: Exercise["muscleGroup"]) => {
  switch (muscleGroup) {
    case "CHEST":
      return "Ngực";
    case "BACK":
      return "Lưng";
    case "ARMS":
      return "Tay";
    case "LEGS":
      return "Chân";
    case "ABS":
      return "Bụng";
    case "CORE":
      return "Core";
    case "CARDIO":
      return "Cardio";
    default:
      return muscleGroup;
  }
};

const getDayLabel = (dayOfWeek: number) => {
  const map: Record<number, string> = {
    1: "Thứ 2",
    2: "Thứ 3",
    3: "Thứ 4",
    4: "Thứ 5",
    5: "Thứ 6",
    6: "Thứ 7",
    7: "Chủ nhật",
  };

  return map[dayOfWeek] || `Ngày ${dayOfWeek}`;
};

function ExerciseItem({ item }: { item: Exercise }) {
  return (
    <Pressable
      style={styles.exerciseItem}
      onPress={() =>
        router.push({
          pathname: APP_ROUTES.EXERCISE_DETAIL,
          params: { id: item.id },
        })
      }
    >
      <Image source={{ uri: item.thumbnail }} style={styles.exerciseThumbnail} contentFit="cover" />
      <View style={styles.exerciseContent}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <Text style={styles.exerciseMeta}>
          {getLevelLabel(item.level)} • {getMuscleGroupLabel(item.muscleGroup)}
        </Text>
        <Text style={styles.exerciseDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      <Ionicons name="play-circle-outline" size={28} color="#22C55E" />
    </Pressable>
  );
}

export default function ProgramDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const programId = getStringParam(params.id);
  const [selectedDayId, setSelectedDayId] = useState("");
  const [selectedDuration, setSelectedDuration] = useState(30);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["programs", "detail-source"],
    queryFn: () => getPrograms({ page: 1, itemsPerPage: 100 }),
  });

  const programs = useMemo(() => data?.data ?? [], [data]);
  const program = useMemo<Program | undefined>(
    () => programs.find((item: Program) => item.id === programId),
    [programId, programs],
  );

  const sortedDays = useMemo(
    () =>
      [...(program?.days ?? [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    [program?.days],
  );

  const selectedDay = useMemo<ProgramDay | undefined>(
    () => sortedDays.find((day) => day.id === selectedDayId) ?? sortedDays[0],
    [selectedDayId, sortedDays],
  );

  const selectedExercises = useMemo(
    () =>
      [...(selectedDay?.exercises ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => item.exercise),
    [selectedDay],
  );

  useEffect(() => {
    if (sortedDays.length && !selectedDayId) {
      setSelectedDayId(sortedDays[0].id);
    }
  }, [selectedDayId, sortedDays]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.stateText}>Đang tải chương trình tập...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !program) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.stateContainer}>
          <Text style={styles.errorTitle}>Không tải được chương trình tập</Text>
          <Text style={styles.stateText}>
            Vui lòng thử lại sau hoặc kiểm tra lại dữ liệu chương trình.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
          </Pressable>
          <Text style={styles.headerTitle}>Chương trình tập</Text>
        </View>

        <View style={styles.heroCard}>
          <Image source={{ uri: program.thumbnail }} style={styles.heroImage} contentFit="cover" />
          <View style={styles.heroBody}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getLevelLabel(program.level)}</Text>
              </View>
              <View style={styles.badgeMuted}>
                <Text style={styles.badgeMutedText}>
                  {program.daysPerWeek} buổi / tuần
                </Text>
              </View>
            </View>

            <Text style={styles.programName}>{program.name}</Text>
            <Text style={styles.programDescription}>{program.description}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{sortedDays.length}</Text>
                <Text style={styles.statLabel}>Ngày tập</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {sortedDays.reduce((total, day) => total + day.exercises.length, 0)}
                </Text>
                <Text style={styles.statLabel}>Bài tập</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn ngày tập</Text>
          <FlatList
            data={sortedDays}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => {
              const isActive = item.id === selectedDay?.id;

              return (
                <Pressable
                  onPress={() => setSelectedDayId(item.id)}
                  style={[styles.dayChip, isActive && styles.dayChipActive]}
                >
                  <Text style={[styles.dayChipText, isActive && styles.dayChipTextActive]}>
                    {getDayLabel(item.dayOfWeek)}
                  </Text>
                  <Text
                    style={[
                      styles.dayChipSubtext,
                      isActive && styles.dayChipSubtextActive,
                    ]}
                  >
                    {item.exercises.length} bài
                  </Text>
                </Pressable>
              );
            }}
            contentContainerStyle={styles.daysListContent}
          />
        </View>

        {selectedDay && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{selectedDay.title}</Text>
            {!!selectedDay.note && (
              <Text style={styles.dayNote}>{selectedDay.note}</Text>
            )}

            <View style={styles.durationCard}>
              <Text style={styles.durationTitle}>Thời lượng mỗi bài tập</Text>
              <View style={styles.durationOptions}>
                {durationOptions.map((option) => {
                  const isActive = option === selectedDuration;

                  return (
                    <Pressable
                      key={option}
                      style={[
                        styles.durationOption,
                        isActive && styles.durationOptionActive,
                      ]}
                      onPress={() => setSelectedDuration(option)}
                    >
                      <Text
                        style={[
                          styles.durationOptionText,
                          isActive && styles.durationOptionTextActive,
                        ]}
                      >
                        {option < 60 ? `${option}s` : `${option / 60}p`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.durationHint}>
                Mỗi bài tập trong ngày này sẽ chạy theo thời lượng bạn chọn.
              </Text>
            </View>

            <View style={styles.startCard}>
              <View>
                <Text style={styles.startTitle}>Sẵn sàng cho buổi tập?</Text>
                <Text style={styles.startSubtitle}>
                  Bắt đầu chạy lần lượt {selectedExercises.length} bài của{" "}
                  {getDayLabel(selectedDay.dayOfWeek)}.
                </Text>
              </View>

              <Pressable
                style={styles.startButton}
                onPress={() =>
                  router.push({
                    pathname: APP_ROUTES.PROGRAM_SESSION,
                    params: {
                      programId,
                      dayId: selectedDay.id,
                      durationSeconds: String(selectedDuration),
                    },
                  })
                }
              >
                <Text style={styles.startButtonText}>Bắt đầu tập luyện</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bài tập của ngày đã chọn</Text>
          {selectedExercises.length ? (
            selectedExercises.map((exercise) => (
              <ExerciseItem key={exercise.id} item={exercise} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Chưa có bài tập</Text>
              <Text style={styles.emptyText}>
                Ngày tập này hiện chưa có bài tập nào được cấu hình.
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
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
  },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#111827",
  },
  heroBody: {
    padding: 18,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 14,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },
  badgeText: {
    color: "#08110A",
    fontSize: 12,
    fontWeight: "800",
  },
  badgeMuted: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "#182235",
  },
  badgeMutedText: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "700",
  },
  programName: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 10,
  },
  programDescription: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#182235",
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  statValue: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  section: {
    marginTop: 22,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: "#F8FAFC",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 14,
  },
  daysListContent: {
    paddingRight: 20,
  },
  dayChip: {
    minWidth: 108,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginRight: 12,
  },
  dayChipActive: {
    backgroundColor: "#22C55E",
    borderColor: "#22C55E",
  },
  dayChipText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  dayChipTextActive: {
    color: "#08110A",
  },
  dayChipSubtext: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  dayChipSubtextActive: {
    color: "rgba(8,17,10,0.72)",
  },
  dayNote: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    marginTop: -4,
    marginBottom: 12,
  },
  durationCard: {
    borderRadius: 22,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    marginBottom: 16,
  },
  durationTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },
  durationOptions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  durationOption: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
  },
  durationOptionActive: {
    backgroundColor: "#22C55E",
  },
  durationOptionText: {
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "800",
  },
  durationOptionTextActive: {
    color: "#08110A",
  },
  durationHint: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },
  startCard: {
    borderRadius: 22,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
  },
  startTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  startSubtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 16,
  },
  startButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonText: {
    color: "#08110A",
    fontSize: 16,
    fontWeight: "800",
  },
  exerciseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 20,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 14,
    marginBottom: 12,
  },
  exerciseThumbnail: {
    width: 84,
    height: 84,
    borderRadius: 18,
    backgroundColor: "#111827",
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  exerciseMeta: {
    color: "#22C55E",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  exerciseDescription: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
  },
  emptyState: {
    borderRadius: 22,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 20,
  },
  emptyTitle: {
    color: "#F8FAFC",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  stateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorTitle: {
    color: "#F8FAFC",
    fontSize: 20,
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
});
