import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { PackageUnit } from 'generated/prisma/enums';

export class CreatePackageDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(PackageUnit)
  unit: PackageUnit;

  @IsNotEmpty()
  @IsNumber()
  durationValue: number;

  @IsNotEmpty()
  @IsBoolean()
  hasPt: boolean;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  description?: string;
}
