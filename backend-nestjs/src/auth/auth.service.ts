import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class AuthService implements OnModuleInit {
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    // Only initialize Firebase if we have real credentials
    if (this.configService.get('FIREBASE_PROJECT_ID') !== 'your-firebase-project-id') {
      this.initializeFirebase();
    } else {
      console.warn('⚠️  Firebase Admin SDK not initialized - using placeholder credentials');
      console.warn('📋 To enable Firebase Auth:');
      console.warn('   1. Go to Firebase Console → Project Settings → Service Accounts');
      console.warn('   2. Generate new private key');
      console.warn('   3. Update .env file with real credentials');
    }
  }

  private initializeFirebase() {
    try {
      // Check if Firebase app is already initialized
      if (admin.apps.length === 0) {
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

        if (!projectId || !privateKey || !clientEmail) {
          throw new Error('Missing Firebase configuration. Please check your environment variables.');
        }

        // Initialize Firebase Admin SDK
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: privateKey.replace(/\\n/g, '\n'),
            clientEmail,
          }),
          projectId,
        });

        console.log('Firebase Admin SDK initialized successfully');
      } else {
        this.firebaseApp = admin.app();
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
      throw error;
    }
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      console.error('Error verifying Firebase ID token:', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    try {
      const userRecord = await admin.auth().getUser(uid);
      return userRecord;
    } catch (error) {
      console.error('Error fetching user by UID:', error);
      throw new UnauthorizedException('User not found');
    }
  }

  extractTokenFromHeader(authorizationHeader: string): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [bearer, token] = authorizationHeader.split(' ');
    
    if (bearer !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    return token;
  }

  async validateUser(idToken: string): Promise<any> {
    try {
      const decodedToken = await this.verifyIdToken(idToken);
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
        firebase: decodedToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
