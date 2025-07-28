import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
  name?: string;
  picture?: string;
  firebase: DecodedIdToken;
}

export interface JwtPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user: AuthenticatedUser;
}
