import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseStrategy } from './firebase.strategy';

@Module({
  imports: [ConfigModule],
  providers: [
    AuthService,
    FirebaseAuthGuard,
    FirebaseStrategy,
  ],
  exports: [
    AuthService,
    FirebaseAuthGuard,
  ],
})
export class AuthModule {}
