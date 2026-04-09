import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { AccountModule } from './account/account.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { BranchModule } from './branch/branch.module';
import { PackageModule } from './package/package.module';
import { UserPackageModule } from './user-package/user-package.module';
import { PersonalTrainerModule } from './personal-trainer/personal-trainer.module';
import { ExcerciseModule } from './excercise/excercise.module';
import { ProgramModule } from './program/program.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AccountModule,
    AuthModule,
    MailModule,
    BranchModule,
    PackageModule,
    UserPackageModule,
    PersonalTrainerModule,
    ExcerciseModule,
    ProgramModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
