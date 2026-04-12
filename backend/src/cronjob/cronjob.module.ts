import { Module } from '@nestjs/common';
import { CronjobService } from './cronjob.service';
import { CronjobController } from './cronjob.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [CronjobController],
  providers: [CronjobService, PrismaService],
})
export class CronjobModule {}
