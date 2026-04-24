import { Transform } from 'class-transformer';
import { ShiftType } from 'generated/prisma/enums';
import { IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class FilterAvailablePtDto {
  @IsUUID()
  branchId: string;

  @IsOptional()
  @IsEnum(ShiftType)
  shiftType?: ShiftType;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from must be yyyy-MM-dd',
  })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to must be yyyy-MM-dd',
  })
  to?: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim())
  @IsString()
  search?: string;
}
