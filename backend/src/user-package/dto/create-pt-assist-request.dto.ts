import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePtAssistRequestDto {
  @IsNotEmpty()
  @IsUUID()
  userPackageId: string;

  @IsNotEmpty()
  @IsUUID()
  slotId: string;

  @IsOptional()
  @IsString()
  note?: string;
}
