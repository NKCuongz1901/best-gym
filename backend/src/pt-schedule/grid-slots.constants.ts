/**
 * Official booking grid rows (VN wall clock). dayOfWeek 1 = Mon … 7 = Sun (ISO).
 */
export const PT_BOOKING_GRID_SLOTS = [
  { key: 'R06', startTime: '06:00', endTime: '08:00' },
  { key: 'R08', startTime: '08:00', endTime: '10:00' },
  { key: 'R10', startTime: '10:00', endTime: '12:00' },
  { key: 'R13', startTime: '13:00', endTime: '15:00' },
  { key: 'R15', startTime: '15:00', endTime: '17:00' },
  { key: 'R17', startTime: '17:00', endTime: '19:00' },
  { key: 'R19', startTime: '19:00', endTime: '21:00' },
  /** Carried over from deprecated 3-shift seed for migrated rows */
  { key: 'R0709', startTime: '07:00', endTime: '09:00' },
  { key: 'R1820', startTime: '18:00', endTime: '20:00' },
] as const;

export type PtGridSlotDef = (typeof PT_BOOKING_GRID_SLOTS)[number];
