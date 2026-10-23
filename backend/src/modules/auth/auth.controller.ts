import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SESSION_COOKIE } from './auth.constants';
import { AuthService } from './auth.service';
import { LoginDto } from './login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const token = await this.auth.login(dto.password);
    res.cookie(SESSION_COOKIE, token, this.auth.cookieOptions());
    return { ok: true };
  }

  @Public()
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    const { maxAge: _maxAge, ...opts } = this.auth.cookieOptions();
    res.clearCookie(SESSION_COOKIE, opts);
    return { ok: true };
  }

  /** Usado pelo front para saber se a sessão ainda vale. */
  @Get('me')
  me() {
    return { ok: true };
  }
}
