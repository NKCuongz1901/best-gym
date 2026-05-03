import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

/** Một ô thời khoá biểu PT bật (must match PT_BOOKING_GRID_SLOTS) */
export class PtWeeklySlotInputDto {
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek: number;

  @Matches(/^\d{1,2}:\d{2}$/, {
    message: 'startTime must be HH:mm',
  })
  startTime: string;

  @Matches(/^\d{1,2}:\d{2}$/, {
    message: 'endTime must be HH:mm',
  })
  endTime: string;
}

export class CreatePtTrainingSlotDto {
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  /** Ngày bắt đầu (yyyy-MM-dd, inclusive, VN) */
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  fromDate: string;

  /** Ngày kết thúc (yyyy-MM-dd, inclusive, VN) */
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  toDate: string;

  /** Chỉ gửi các ô được bật */
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PtWeeklySlotInputDto)
  slots: PtWeeklySlotInputDto[];
}
