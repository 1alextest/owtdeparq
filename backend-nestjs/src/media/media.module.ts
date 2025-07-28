import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaFile } from '../entities/media-file.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaFile]),
    AuthModule,
  ],
  controllers: [MediaController],
  providers: [
    MediaService,
  ],
  exports: [
    MediaService,
  ],
})
export class MediaModule {}
