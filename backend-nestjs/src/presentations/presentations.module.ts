import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PresentationsController } from './presentations.controller';
import { PresentationsService } from './presentations.service';
import { Presentation } from '../entities/presentation.entity';
import { Project } from '../entities/project.entity';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Presentation, Project]),
    AuthModule,
    ProjectsModule,
  ],
  controllers: [PresentationsController],
  providers: [PresentationsService],
  exports: [PresentationsService],
})
export class PresentationsModule {}
