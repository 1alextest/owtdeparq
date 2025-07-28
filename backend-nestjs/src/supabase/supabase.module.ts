import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupabaseService } from './supabase.service';

@Module({
  imports: [ConfigModule, TypeOrmModule],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}