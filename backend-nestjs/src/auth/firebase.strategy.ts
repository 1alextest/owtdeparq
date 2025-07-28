import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase') {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'firebase', // This is not used for Firebase tokens
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any): Promise<any> {
    try {
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      const user = await this.authService.validateUser(token);
      return user;
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
