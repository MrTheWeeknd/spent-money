import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { CookieOptions } from 'express';
import { EnvVars } from '../../config/env.validation';

@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService<EnvVars, true>,
    private readonly jwt: JwtService,
  ) {}

  async login(password: string): Promise<string> {
    const ok = await bcrypt.compare(password, this.config.get('AUTH_PASSWORD_HASH'));
    if (!ok) throw new UnauthorizedException('Senha incorreta');
    return this.jwt.signAsync({ sub: 'owner' });
  }

  async verify(token: string | undefined): Promise<boolean> {
    if (!token) return false;
    try {
      await this.jwt.verifyAsync(token);
      return true;
    } catch {
      return false;
    }
  }

  cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('COOKIE_SECURE'),
      sameSite: 'lax',
      path: '/',
      maxAge: this.config.get('SESSION_DAYS') * 24 * 60 * 60 * 1000,
    };
  }
}
