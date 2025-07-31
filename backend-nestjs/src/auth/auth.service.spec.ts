import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

import { AuthService } from './auth.service';

// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  app: jest.fn(),
  credential: {
    cert: jest.fn(),
  },
  auth: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let configService: jest.Mocked<ConfigService>;
  let mockAuth: jest.Mocked<admin.auth.Auth>;

  const mockDecodedToken = {
    uid: 'user-123',
    email: 'test@example.com',
    email_verified: true,
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    iss: 'https://securetoken.google.com/test-project',
    aud: 'test-project',
    auth_time: 1234567890,
    user_id: 'user-123',
    sub: 'user-123',
    iat: 1234567890,
    exp: 1234567890 + 3600,
    firebase: {
      identities: {},
      sign_in_provider: 'password',
    },
  };

  const mockUserRecord = {
    uid: 'user-123',
    email: 'test@example.com',
    emailVerified: true,
    displayName: 'Test User',
    photoURL: 'https://example.com/avatar.jpg',
    disabled: false,
    metadata: {
      creationTime: '2024-01-01T00:00:00.000Z',
      lastSignInTime: '2024-01-01T00:00:00.000Z',
    },
    providerData: [],
    customClaims: {},
    tenantId: null,
    tokensValidAfterTime: '2024-01-01T00:00:00.000Z',
  } as admin.auth.UserRecord;

  beforeEach(async () => {
    // Reset Firebase apps mock
    (admin.apps as any).length = 0;

    // Create mock auth instance
    mockAuth = {
      verifyIdToken: jest.fn(),
      getUser: jest.fn(),
    } as any;

    // Mock Firebase admin.auth() to return our mock
    (admin.auth as jest.Mock).mockReturnValue(mockAuth);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    configService = module.get(ConfigService);

    // Mock console methods to avoid output during tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    (admin.apps as any).length = 0;
  });

  describe('onModuleInit', () => {
    it('should initialize Firebase with valid credentials', () => {
      const mockCredential = { mock: 'credential' };
      (admin.credential.cert as jest.Mock).mockReturnValue(mockCredential);

      configService.get
        .mockReturnValueOnce('test-project-id') // FIREBASE_PROJECT_ID
        .mockReturnValueOnce('test-project-id') // FIREBASE_PROJECT_ID (second call)
        .mockReturnValueOnce('-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n') // FIREBASE_PRIVATE_KEY
        .mockReturnValueOnce('test@test-project.iam.gserviceaccount.com'); // FIREBASE_CLIENT_EMAIL

      service.onModuleInit();

      expect(admin.credential.cert).toHaveBeenCalledWith({
        projectId: 'test-project-id',
        privateKey: '-----BEGIN PRIVATE KEY-----\ntest-key\n-----END PRIVATE KEY-----\n',
        clientEmail: 'test@test-project.iam.gserviceaccount.com',
      });
      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: mockCredential,
        projectId: 'test-project-id',
      });
      expect(console.log).toHaveBeenCalledWith('Firebase Admin SDK initialized successfully');
    });

    it('should warn when using placeholder credentials', () => {
      configService.get.mockReturnValue('your-firebase-project-id');

      service.onModuleInit();

      expect(admin.initializeApp).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('⚠️  Firebase Admin SDK not initialized - using placeholder credentials');
    });

    it('should use existing Firebase app if already initialized', () => {
      (admin.apps as any).length = 1;
      configService.get.mockReturnValue('test-project-id');

      service.onModuleInit();

      expect(admin.initializeApp).not.toHaveBeenCalled();
      expect(admin.app).toHaveBeenCalled();
    });

    it('should throw error when Firebase configuration is missing', () => {
      configService.get
        .mockReturnValueOnce('test-project-id') // FIREBASE_PROJECT_ID (first check)
        .mockReturnValueOnce(null) // FIREBASE_PROJECT_ID (second call)
        .mockReturnValueOnce(null) // FIREBASE_PRIVATE_KEY
        .mockReturnValueOnce(null); // FIREBASE_CLIENT_EMAIL

      expect(() => service.onModuleInit()).toThrow('Missing Firebase configuration');
    });
  });

  describe('verifyIdToken', () => {
    beforeEach(() => {
      // Initialize service with valid config
      configService.get
        .mockReturnValueOnce('test-project-id')
        .mockReturnValueOnce('test-project-id')
        .mockReturnValueOnce('test-private-key')
        .mockReturnValueOnce('test@test.com');
      service.onModuleInit();
    });

    it('should verify valid ID token', async () => {
      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      const result = await service.verifyIdToken('valid-token');

      expect(mockAuth.verifyIdToken).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(mockDecodedToken);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyIdToken('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.verifyIdToken('invalid-token')).rejects.toThrow(
        'Invalid or expired token'
      );
    });

    it('should throw UnauthorizedException for expired token', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Token expired'));

      await expect(service.verifyIdToken('expired-token')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should log error details', async () => {
      const error = new Error('Token verification failed');
      mockAuth.verifyIdToken.mockRejectedValue(error);

      await expect(service.verifyIdToken('invalid-token')).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Error verifying Firebase ID token:',
        error
      );
    });
  });

  describe('getUserByUid', () => {
    beforeEach(() => {
      // Initialize service with valid config
      configService.get
        .mockReturnValueOnce('test-project-id')
        .mockReturnValueOnce('test-project-id')
        .mockReturnValueOnce('test-private-key')
        .mockReturnValueOnce('test@test.com');
      service.onModuleInit();
    });

    it('should get user by UID', async () => {
      mockAuth.getUser.mockResolvedValue(mockUserRecord);

      const result = await service.getUserByUid('user-123');

      expect(mockAuth.getUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUserRecord);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      mockAuth.getUser.mockRejectedValue(new Error('User not found'));

      await expect(service.getUserByUid('non-existent')).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.getUserByUid('non-existent')).rejects.toThrow(
        'User not found'
      );
    });

    it('should log error details', async () => {
      const error = new Error('Firebase error');
      mockAuth.getUser.mockRejectedValue(error);

      await expect(service.getUserByUid('user-123')).rejects.toThrow();

      expect(console.error).toHaveBeenCalledWith(
        'Error fetching user by UID:',
        error
      );
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const result = service.extractTokenFromHeader('Bearer valid-token-123');

      expect(result).toBe('valid-token-123');
    });

    it('should throw UnauthorizedException for missing header', () => {
      expect(() => service.extractTokenFromHeader('')).toThrow(
        UnauthorizedException
      );
      expect(() => service.extractTokenFromHeader('')).toThrow(
        'Authorization header is missing'
      );
    });

    it('should throw UnauthorizedException for null header', () => {
      expect(() => service.extractTokenFromHeader(null as any)).toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for invalid format', () => {
      expect(() => service.extractTokenFromHeader('InvalidFormat')).toThrow(
        UnauthorizedException
      );
      expect(() => service.extractTokenFromHeader('InvalidFormat')).toThrow(
        'Invalid authorization header format'
      );
    });

    it('should throw UnauthorizedException for missing Bearer prefix', () => {
      expect(() => service.extractTokenFromHeader('Token abc123')).toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for missing token', () => {
      expect(() => service.extractTokenFromHeader('Bearer ')).toThrow(
        UnauthorizedException
      );
      expect(() => service.extractTokenFromHeader('Bearer')).toThrow(
        UnauthorizedException
      );
    });

    it('should handle tokens with special characters', () => {
      const tokenWithSpecialChars = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.EkN-DOsnsuRjRO6BxXemmJDm3HbxrbRzXglbN2S4sOkopdU4IsDxTI8jO19W_A4K8ZPJijNLis4EZsHeY559a4DFOd50_OqgHs3PheWJHz_KFSLHjLpHpKDXO4Fo3tx';

      const result = service.extractTokenFromHeader(`Bearer ${tokenWithSpecialChars}`);

      expect(result).toBe(tokenWithSpecialChars);
    });
  });

  describe('validateUser', () => {
    beforeEach(() => {
      // Initialize service with valid config
      configService.get
        .mockReturnValueOnce('test-project-id')
        .mockReturnValueOnce('test-project-id')
        .mockReturnValueOnce('test-private-key')
        .mockReturnValueOnce('test@test.com');
      service.onModuleInit();
    });

    it('should validate user and return user object', async () => {
      mockAuth.verifyIdToken.mockResolvedValue(mockDecodedToken);

      const result = await service.validateUser('valid-token');

      expect(result).toEqual({
        uid: mockDecodedToken.uid,
        email: mockDecodedToken.email,
        emailVerified: mockDecodedToken.email_verified,
        name: mockDecodedToken.name,
        picture: mockDecodedToken.picture,
        firebase: mockDecodedToken,
      });
    });

    it('should handle user without optional fields', async () => {
      const minimalToken = {
        uid: 'user-123',
        email: 'test@example.com',
        email_verified: false,
      };

      mockAuth.verifyIdToken.mockResolvedValue(minimalToken as any);

      const result = await service.validateUser('valid-token');

      expect(result).toEqual({
        uid: 'user-123',
        email: 'test@example.com',
        emailVerified: false,
        name: undefined,
        picture: undefined,
        firebase: minimalToken,
      });
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.validateUser('invalid-token')).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.validateUser('invalid-token')).rejects.toThrow(
        'Token validation failed'
      );
    });

    it('should handle Firebase auth errors gracefully', async () => {
      mockAuth.verifyIdToken.mockRejectedValue(
        new Error('Firebase: Error (auth/id-token-expired)')
      );

      await expect(service.validateUser('expired-token')).rejects.toThrow(
        UnauthorizedException
      );
    });
  });
});