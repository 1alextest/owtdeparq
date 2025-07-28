import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { Project } from '../entities/project.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Project]),
  ],
  controllers: [HealthController],
})
export class HealthModule {}