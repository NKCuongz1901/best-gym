'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import type { TrainingProgram } from '@/app/data/trainingPrograms';
import { levelLabels } from '@/app/lib/exerciseLabels';

type ProgramCardProps = {
  program: TrainingProgram;
};

export default function ProgramCard({ program }: ProgramCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-sm border border-neutral-200 bg-white shadow-sm"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-neutral-900">{program.name}</h3>
            <p className="mt-2 text-neutral-600">{program.description}</p>
          </div>
          <span className="shrink-0 rounded-sm bg-neutral-900 px-3 py-1 text-sm font-semibold text-white">
            {program.daysPerWeek} ngày/tuần
          </span>
        </div>
        <div className="mt-4 flex gap-3">
          <span className="rounded-sm bg-neutral-100 px-3 py-1 text-sm text-neutral-800">
            {levelLabels[program.level]}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-4 flex items-center gap-2 text-sm font-semibold text-neutral-900 transition-colors hover:text-neutral-600"
        >
          <CalendarOutlined />
          {expanded ? 'Ẩn lịch tập' : 'Xem lịch tập chi tiết'}
          {expanded ? <UpOutlined className="text-xs" /> : <DownOutlined className="text-xs" />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-neutral-200"
          >
            <div className="divide-y divide-neutral-200">
              {program.schedule.map((day) => (
                <div key={day.day} className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-neutral-900">{day.day}</span>
                    <span className="text-sm text-neutral-700">{day.focus}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {day.exerciseNames.map((name) => (
                      <span
                        key={name}
                        className="rounded-sm bg-neutral-100 px-2 py-1 text-xs text-neutral-600"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
