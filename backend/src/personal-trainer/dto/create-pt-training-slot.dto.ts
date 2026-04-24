import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreatePtTrainingSlotDto {
  @IsNotEmpty()
  @IsUUID()
  branchId: string;

  @IsNotEmpty()
  @IsUUID()
  shiftTemplateId: string;

  @IsNotEmpty()
  @IsDateString()
  fromDate: string;

  @IsNotEmpty()
  @IsDateString()
  toDate: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  @Max(50)
  maxStudents: number;
}
