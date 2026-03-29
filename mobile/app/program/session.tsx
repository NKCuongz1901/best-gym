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
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const getStringParam = (param?: string | string[]) =>
  Array.isArray(param) ? (param[0] ?? "") : (param ?? "");

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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

const getLevelLabel = (level: Exercise["level"]) => {
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

export default function ProgramSessionScreen() {
  const params = useLocalSearchParams<{
    programId?: string | string[];
    dayId?: string | string[];
    durationSeconds?: string | string[];
  }>();

  const programId = getStringParam(params.programId);
  const dayId = getStringParam(params.dayId);
  const durationSeconds = Number(getStringParam(params.durationSeconds)) || 30;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["programs", "session-source"],
    queryFn: () => getPrograms({ page: 1, itemsPerPage: 100 }),
  });

  const programs = useMemo(() => data?.data ?? [], [data]);
  const program = useMemo<Program | undefined>(
    () => programs.find((item: Program) => item.id === programId),
    [programId, programs],
  );

  const selectedDay = useMemo<ProgramDay | undefined>(
    () => program?.days.find((day) => day.id === dayId),
    [dayId, program?.days],
  );

  const exercises = useMemo(
    () =>
      [...(selectedDay?.exercises ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => item.exercise),
    [selectedDay],
  );

  const currentExercise = exercises[currentIndex];
  const totalExercises = exercises.length;
  const progress = totalExercises
    ? ((currentIndex + (isCompleted ? 1 : 0)) / totalExercises) * 100
    : 0;

  useEffect(() => {
    setCurrentIndex(0);
    setSecondsLeft(durationSeconds);
    setIsRunning(false);
    setIsCompleted(false);
  }, [dayId, durationSeconds]);

  useEffect(() => {
    if (!isRunning || isCompleted || !exercises.length) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        if (currentIndex >= exercises.length - 1) {
          setIsRunning(false);
          setIsCompleted(true);
          return 0;
        }

        setCurrentIndex((index) => index + 1);
        return durationSeconds;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, durationSeconds, exercises.length, isCompleted, isRunning]);

  const handlePrevious = () => {
    if (!currentIndex) {
      setSecondsLeft(durationSeconds);
      return;
    }

    setCurrentIndex((prev) => prev - 1);
    setSecondsLeft(durationSeconds);
    setIsCompleted(false);
  };

  const handleNext = () => {
    if (currentIndex >= exercises.length - 1) {
      setSecondsLeft(0);
      setIsRunning(false);
      setIsCompleted(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSecondsLeft(durationSeconds);
    setIsCompleted(false);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSecondsLeft(durationSeconds);
    setIsCompleted(false);
    setIsRunning(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.stateText}>Đang chuẩn bị buổi tập...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !program || !selectedDay || !exercises.length || !currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.stateContainer}>
          <Text style={styles.errorTitle}>Không thể bắt đầu buổi tập</Text>
          <Text style={styles.stateText}>
            Không tìm thấy lịch tập hoặc danh sách bài tập cho ngày đã chọn.
          </Text>
          <Pressable onPress={() => router.back()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="close" size={22} color="#F8FAFC" />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{program.name}</Text>
          <Text style={styles.headerSubtitle}>
            {selectedDay.title} • {getDayLabel(selectedDay.dayOfWeek)}
          </Text>
        </View>

        <Pressable onPress={handleRestart} style={styles.iconButton}>
          <Ionicons name="refresh" size={22} color="#F8FAFC" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Tiến độ buổi tập</Text>
            <Text style={styles.progressValue}>
              {Math.min(currentIndex + 1, totalExercises)}/{totalExercises}
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
          </View>
        </View>

        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Bài tập hiện tại</Text>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          <Text style={styles.exerciseMeta}>{getLevelLabel(currentExercise.level)}</Text>

          <Image
            source={{ uri: currentExercise.thumbnail }}
            style={styles.exerciseImage}
            contentFit="cover"
          />

          <Text style={styles.timerValue}>{formatTime(secondsLeft)}</Text>
          <Text style={styles.timerHint}>
            {isCompleted
              ? "Bạn đã hoàn thành buổi tập hôm nay."
              : `Mỗi bài tập chạy ${durationSeconds < 60 ? `${durationSeconds}s` : `${durationSeconds / 60}p`}.`}
          </Text>

          <View style={styles.controlsRow}>
            <Pressable style={styles.controlButton} onPress={handlePrevious}>
              <Ionicons name="play-skip-back" size={24} color="#F8FAFC" />
            </Pressable>

            <Pressable
              style={styles.playButton}
              onPress={() => setIsRunning((prev) => !prev)}
              disabled={isCompleted}
            >
              <Ionicons
                name={isRunning ? "pause" : "play"}
                size={26}
                color="#08110A"
              />
            </Pressable>

            <Pressable style={styles.controlButton} onPress={handleNext}>
              <Ionicons name="play-skip-forward" size={24} color="#F8FAFC" />
            </Pressable>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.secondaryButton}
              onPress={() =>
                router.push({
                  pathname: APP_ROUTES.EXERCISE_DETAIL,
                  params: { id: currentExercise.id },
                })
              }
            >
              <Text style={styles.secondaryButtonText}>Xem video bài hiện tại</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.queueCard}>
          <Text style={styles.queueTitle}>Lịch bài tập của ngày này</Text>
          {exercises.map((exercise, index) => {
            const isCurrent = index === currentIndex && !isCompleted;
            const isDone = index < currentIndex || isCompleted;

            return (
              <View
                key={exercise.id}
                style={[
                  styles.queueItem,
                  isCurrent && styles.queueItemCurrent,
                  isDone && styles.queueItemDone,
                ]}
              >
                <View style={styles.queueIndex}>
                  <Text style={styles.queueIndexText}>{index + 1}</Text>
                </View>

                <View style={styles.queueContent}>
                  <Text style={styles.queueName}>{exercise.name}</Text>
                  <Text style={styles.queueMeta}>
                    {getLevelLabel(exercise.level)} • {formatTime(durationSeconds)}
                  </Text>
                </View>

                {isDone ? (
                  <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                ) : isCurrent ? (
                  <Ionicons name="time-outline" size={24} color="#22C55E" />
                ) : (
                  <Ionicons name="ellipse-outline" size={24} color="#64748B" />
                )}
              </View>
            );
          })}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 4,
    textAlign: "center",
  },
  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  progressCard: {
    borderRadius: 22,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressTitle: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "800",
  },
  progressValue: {
    color: "#22C55E",
    fontSize: 15,
    fontWeight: "800",
  },
  progressBarTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#182235",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#22C55E",
  },
  timerCard: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
    marginBottom: 16,
    alignItems: "center",
  },
  timerLabel: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  exerciseName: {
    color: "#F8FAFC",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  exerciseMeta: {
    color: "#22C55E",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 16,
  },
  exerciseImage: {
    width: "100%",
    height: 220,
    borderRadius: 22,
    backgroundColor: "#111827",
    marginBottom: 20,
  },
  timerValue: {
    color: "#F8FAFC",
    fontSize: 56,
    fontWeight: "900",
    marginBottom: 8,
  },
  timerHint: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 20,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    width: "100%",
  },
  secondaryButton: {
    height: 52,
    borderRadius: 18,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "800",
  },
  queueCard: {
    borderRadius: 24,
    backgroundColor: "#101826",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 18,
  },
  queueTitle: {
    color: "#F8FAFC",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  queueItemCurrent: {
    backgroundColor: "rgba(34,197,94,0.08)",
    borderRadius: 18,
    paddingHorizontal: 10,
  },
  queueItemDone: {
    opacity: 0.85,
  },
  queueIndex: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#182235",
    alignItems: "center",
    justifyContent: "center",
  },
  queueIndexText: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "800",
  },
  queueContent: {
    flex: 1,
  },
  queueName: {
    color: "#F8FAFC",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  queueMeta: {
    color: "#94A3B8",
    fontSize: 13,
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
    marginBottom: 16,
  },
  primaryButton: {
    minWidth: 160,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: "#08110A",
    fontSize: 15,
    fontWeight: "800",
  },
});
