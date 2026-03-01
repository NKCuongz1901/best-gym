import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { FilterPackageDto } from './dto/filter-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Injectable()
export class PackageService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPackageDto: CreatePackageDto) {
    const { name, unit, durationValue, hasPt, price, description } =
      createPackageDto;
    const newPackage = await this.prisma.package.create({
      data: {
        name,
        unit,
        durationValue,
        hasPt,
        price,
        description,
      },
    });
    return {
      message: 'Create package successfully',
      data: newPackage,
    };
  }

  async findAll(filterPackageDto: FilterPackageDto) {
    const {
      page = 1,
      itemsPerPage = 10,
      unit,
      isActive = true,
    } = filterPackageDto;
    const skip = (page - 1) * itemsPerPage;

    const whereCondition: { unit?: typeof unit; isActive?: boolean } = {
      isActive,
    };
    if (unit !== undefined) whereCondition.unit = unit;

    const total = await this.prisma.package.count({
      where: whereCondition,
    });
    const totalPages = Math.ceil(total / itemsPerPage);
    const packages = await this.prisma.package.findMany({
      where: whereCondition,
      skip,
      take: itemsPerPage,
      orderBy: { createdAt: 'desc' },
    });

    return {
      message: 'Get packages successfully',
      meta: {
        page,
        itemsPerPage,
        total,
        totalPages,
      },
      data: packages,
    };
  }

  async findOne(id: string) {
    const pkg = await this.prisma.package.findUnique({
      where: { id },
    });
    if (!pkg) {
      throw new NotFoundException(`Package with id ${id} not found`);
    }
    return {
      message: 'Get package successfully',
      data: pkg,
    };
  }

  async update(id: string, updatePackageDto: UpdatePackageDto) {
    const data: Parameters<typeof this.prisma.package.update>[0]['data'] = {};
    if (updatePackageDto.name !== undefined) data.name = updatePackageDto.name;
    if (updatePackageDto.unit !== undefined) data.unit = updatePackageDto.unit;
    if (updatePackageDto.durationValue !== undefined)
      data.durationValue = updatePackageDto.durationValue;
    if (updatePackageDto.hasPt !== undefined)
      data.hasPt = updatePackageDto.hasPt;
    if (updatePackageDto.price !== undefined)
      data.price = updatePackageDto.price;
    if (updatePackageDto.description !== undefined)
      data.description = updatePackageDto.description;
    if (updatePackageDto.isActive !== undefined)
      data.isActive = updatePackageDto.isActive;

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No fields to update');
    }

    const pkg = await this.prisma.package.update({
      where: { id },
      data,
    });
    return {
      message: 'Update package successfully',
      data: pkg,
    };
  }

  async remove(id: string) {
    await this.prisma.package.findUniqueOrThrow({
      where: { id },
    });
    await this.prisma.package.delete({
      where: { id },
    });
    return {
      message: 'Delete package successfully',
    };
  }
}
