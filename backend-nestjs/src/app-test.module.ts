import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import only basic modules for testing
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Configuration module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Basic modules for testing
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppTestModule {}
