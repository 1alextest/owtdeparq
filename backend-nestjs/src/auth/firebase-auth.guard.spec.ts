import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { FirebaseAuthGuard } from './firebase-auth.guard';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;
  let authService: jest.Mocked<AuthService>;
  let reflector: jest.Mocked<Reflector>;

  const mockUser = {
    uid: 'user-123',
    email: 'test@example.com',
    emailVerified: true,
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    firebase: {
      uid: 'user-123',
      email: 'test@example.com',
      email_verified: true,
    },
  };

  const createMockExecutionContext = (
    headers: any = {},
    isPublic: boolean = false
  ): ExecutionContext => {
    const mockRequest = {
      headers,
      user: undefined,
    };

    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    reflector.getAllAndOverride.mockReturnValue(isPublic);

    return mockContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthGuard,
        {
          provide: AuthService,
          useValue: {
            extractTokenFromHeader: jest.fn(),
            validateUser: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<FirebaseAuthGuard>(FirebaseAuthGuard);
    authService = module.get(AuthService);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access to public routes without authentication', async () => {
      const context = createMockExecutionContext({}, true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
      expect(authService.extractTokenFromHeader).not.toHaveBeenCalled();
      expect(authService.validateUser).not.toHaveBeenCalled();
    });

    it('should authenticate user with valid token', async () => {
      const authorizationHeader = 'Bearer valid-token';
      const context = createMockExecutionContext({
        authorization: authorizationHeader,
      });

      authService.extractTokenFromHeader.mockReturnValue('valid-token');
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(authService.extractTokenFromHeader).toHaveBeenCalledWith(
        authorizationHeader
      );
      expect(authService.validateUser).toHaveBeenCalledWith('valid-token');

      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when authorization header is missing', async () => {
      const context = createMockExecutionContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authorization header is missing'
      );

      expect(authService.extractTokenFromHeader).not.toHaveBeenCalled();
      expect(authService.validateUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when authorization header is empty', async () => {
      const context = createMockExecutionContext({
        authorization: '',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authorization header is missing'
      );
    });

    it('should throw UnauthorizedException when token extraction fails', async () => {
      const authorizationHeader = 'Invalid header format';
      const context = createMockExecutionContext({
        authorization: authorizationHeader,
      });

      authService.extractTokenFromHeader.mockImplementation(() => {
        throw new UnauthorizedException('Invalid authorization header format');
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authentication failed'
      );

      expect(authService.extractTokenFromHeader).toHaveBeenCalledWith(
        authorizationHeader
      );
      expect(authService.validateUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user validation fails', async () => {
      const authorizationHeader = 'Bearer invalid-token';
      const context = createMockExecutionContext({
        authorization: authorizationHeader,
      });

      authService.extractTokenFromHeader.mockReturnValue('invalid-token');
      authService.validateUser.mockRejectedValue(
        new UnauthorizedException('Token validation failed')
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authentication failed'
      );

      expect(authService.extractTokenFromHeader).toHaveBeenCalledWith(
        authorizationHeader
      );
      expect(authService.validateUser).toHaveBeenCalledWith('invalid-token');
    });

    it('should handle expired tokens', async () => {
      const authorizationHeader = 'Bearer expired-token';
      const context = createMockExecutionContext({
        authorization: authorizationHeader,
      });

      authService.extractTokenFromHeader.mockReturnValue('expired-token');
      authService.validateUser.mockRejectedValue(
        new UnauthorizedException('Invalid or expired token')
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authentication failed'
      );
    });

    it('should handle malformed tokens', async () => {
      const authorizationHeader = 'Bearer malformed.token';
      const context = createMockExecutionContext({
        authorization: authorizationHeader,
      });

      authService.extractTokenFromHeader.mockReturnValue('malformed.token');
      authService.validateUser.mockRejectedValue(
        new Error('Token decode failed')
      );

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authentication failed'
      );
    });

    it('should check both handler and class level public decorators', async () => {
      const context = createMockExecutionContext({}, false);

      // Mock reflector to return false (not public)
      reflector.getAllAndOverride.mockReturnValue(false);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      );

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should preserve request object structure when adding user', async () => {
      const authorizationHeader = 'Bearer valid-token';
      const mockRequest = {
        headers: { authorization: authorizationHeader },
        body: { test: 'data' },
        params: { id: '123' },
        query: { filter: 'active' },
      };

      const context = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      reflector.getAllAndOverride.mockReturnValue(false);
      authService.extractTokenFromHeader.mockReturnValue('valid-token');
      authService.validateUser.mockResolvedValue(mockUser);

      await guard.canActivate(context);

      expect(mockRequest).toEqual({
        headers: { authorization: authorizationHeader },
        body: { test: 'data' },
        params: { id: '123' },
        query: { filter: 'active' },
        user: mockUser,
      });
    });
  });
});