'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Result, Spin } from 'antd';
import {
  CaretRightOutlined,
  CheckCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';

import { getPrograms } from '@/app/services/api';
import type {
  Program,
  ProgramDay,
  ProgramDayExercise,
  ProgramsResponse,
} from '@/app/types/types';
import { formatDayOfWeekVietnamese } from '@/app/utils/common';
import { levelLabels, muscleGroupLabels } from '@/app/lib/exerciseLabels';

function sortDays(days: ProgramDay[]) {
  return [...days].sort((a, b) => a.dayOfWeek - b.dayOfWeek);
}

function sortExercises(items: ProgramDayExercise[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

export default function ProgramLearnPage() {
  const router = useRouter();
  const params = useParams<{ programId: string }>();
  const programId = params?.programId;
  const [openSidebar, setOpenSidebar] = useState(true);
  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<ProgramsResponse>({
    queryKey: ['programs', 'learn-detail', programId],
    queryFn: () => getPrograms({ page: 1, itemsPerPage: 200 }),
    enabled: Boolean(programId),
  });

  const program: Program | undefined = useMemo(
    () => (data?.data ?? []).find((p) => p.id === programId),
    [data?.data, programId],
  );

  const sortedDays = useMemo(() => sortDays(program?.days ?? []), [program?.days]);

  const allLessons = useMemo(
    () =>
      sortedDays.flatMap((day) =>
        sortExercises(day.exercises ?? []).map((row) => ({
          day,
          row,
        })),
      ),
    [sortedDays],
  );

  const selectedLesson = useMemo(() => {
    if (!allLessons.length) return null;
    if (activeExerciseId) {
      const found = allLessons.find((x) => x.row.id === activeExerciseId);
      if (found) return found;
    }
    return allLessons[0];
  }, [allLessons, activeExerciseId]);

  const selectedDayId = selectedLesson?.day.id ?? activeDayId;
  const currentExercise = selectedLesson?.row.exercise ?? null;

  const completedPercent =
    allLessons.length > 0 ? Math.round((1 / allLessons.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (isError || !program) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Result
          status="404"
          title="Không tìm thấy chương trình"
          subTitle="Chương trình có thể đã bị xóa hoặc chưa khả dụng."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="border-b border-neutral-800 bg-black/80">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-1 text-xs text-neutral-400 hover:text-white"
            >
              ← Quay lại chương trình
            </button>
            <h1 className="truncate text-lg font-semibold">{program.name}</h1>
            <p className="truncate text-xs text-neutral-400">
              {levelLabels[program.level]} · {program.daysPerWeek} ngày/tuần
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenSidebar((v) => !v)}
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm hover:bg-neutral-800"
          >
            {openSidebar ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px]">
        <main className="border-r border-neutral-800 p-4 lg:p-6">
          <div className="overflow-hidden rounded border border-neutral-800 bg-black">
            <div className="aspect-video bg-neutral-900">
              {currentExercise?.videoUrl ? (
                <iframe
                  src={currentExercise.videoUrl}
                  title={currentExercise.name}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-neutral-400">
                  Bài tập này chưa có video hướng dẫn.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 rounded border border-neutral-800 bg-neutral-900 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm text-neutral-400">
              <PlayCircleOutlined />
              <span>Nội dung bài học</span>
            </div>
            <h2 className="text-2xl font-semibold">
              {currentExercise?.name ?? 'Chưa có bài tập'}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-neutral-800 px-2 py-1">
                {currentExercise
                  ? muscleGroupLabels[currentExercise.muscleGroup]
                  : 'Đang cập nhật'}
              </span>
              <span className="rounded bg-neutral-800 px-2 py-1">
                {currentExercise ? levelLabels[currentExercise.level] : 'Đang cập nhật'}
              </span>
              <span className="rounded bg-neutral-800 px-2 py-1">
                {currentExercise?.equipments || 'Đang cập nhật'}
              </span>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm text-neutral-300">
              {currentExercise?.description || 'Đang cập nhật'}
            </p>
            {currentExercise?.content ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-400">
                {currentExercise.content}
              </p>
            ) : null}
            {currentExercise?.suggestion ? (
              <div className="mt-4 rounded border border-neutral-700 bg-neutral-950 p-3 text-sm text-neutral-300">
                <span className="font-semibold text-white">Gợi ý:</span>{' '}
                {currentExercise.suggestion}
              </div>
            ) : null}
          </div>
        </main>

        <aside
          className={`${openSidebar ? 'block' : 'hidden'} border-t border-neutral-800 bg-neutral-900 lg:block lg:border-t-0`}
        >
          <div className="border-b border-neutral-800 p-4">
            <h3 className="text-base font-semibold">Nội dung chương trình</h3>
            <p className="mt-1 text-xs text-neutral-400">
              {allLessons.length} bài tập · Tiến độ mẫu {completedPercent}%
            </p>
          </div>

          <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
            {sortedDays.length === 0 ? (
              <p className="p-4 text-sm text-neutral-400">Đang cập nhật lịch tập.</p>
            ) : (
              sortedDays.map((day) => {
                const rows = sortExercises(day.exercises ?? []);
                const isActiveDay = selectedDayId === day.id;
                return (
                  <div key={day.id} className="border-b border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setActiveDayId(day.id)}
                      className={`w-full px-4 py-3 text-left transition ${
                        isActiveDay ? 'bg-neutral-800' : 'hover:bg-neutral-800/60'
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        {formatDayOfWeekVietnamese(day.dayOfWeek)}
                      </p>
                      <p className="text-xs text-neutral-400">{day.title}</p>
                    </button>

                    <div className="pb-2">
                      {rows.length === 0 ? (
                        <p className="px-4 py-2 text-xs text-neutral-500">Đang cập nhật</p>
                      ) : (
                        rows.map((row) => {
                          const isCurrent = selectedLesson?.row.id === row.id;
                          return (
                            <button
                              key={row.id}
                              type="button"
                              onClick={() => {
                                setActiveDayId(day.id);
                                setActiveExerciseId(row.id);
                              }}
                              className={`flex w-full items-start gap-2 px-5 py-2.5 text-left text-sm transition ${
                                isCurrent
                                  ? 'bg-violet-600/20 text-white'
                                  : 'text-neutral-300 hover:bg-neutral-800/60'
                              }`}
                            >
                              {isCurrent ? (
                                <CheckCircleOutlined className="mt-0.5 text-violet-300" />
                              ) : (
                                <CaretRightOutlined className="mt-0.5 text-neutral-500" />
                              )}
                              <span className="line-clamp-2">
                                {row.sortOrder}. {row.exercise.name}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

