import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login.dto';
import { RefreshDTO } from './dto/refresh.dto';
import { Public } from './public.decorator';
import type { Request } from 'express';
import { RateLimit } from '../rate-limit/rate-limit.decorator';

const emailFromBody = (req: Request): string | undefined => {
  const email: unknown = req.body?.email;
  return typeof email === 'string' ? email.toLowerCase() : undefined;
};

@Public()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // auth/login
  @Post('login')
  @RateLimit(
    // login:ip -> req.ip used to limit how many times the same user can call this endpoint
    { name: 'login:ip', limit: 10, windowSeconds: 60, key: (req) => req.ip },
    // login:email -> req.body.email (emailFromBody) used to limit how many times the same email can be passed
    { name: 'login:email', limit: 5, windowSeconds: 300, key: emailFromBody },
  )
  @HttpCode(HttpStatus.OK) // 200
  login(@Body() dto: LoginDTO) {
    return this.authService.login(dto);
  }

  // auth/refresh: swaps a refresh token for a new pair. Nothing is created, so 200.
  @Post('refresh')
  @RateLimit({
    name: 'refresh:ip',
    limit: 30,
    windowSeconds: 60,
    key: (req) => req.ip,
  })
  @HttpCode(HttpStatus.OK) // 200
  refresh(@Body() dto: RefreshDTO) {
    return this.authService.refresh(dto.refreshToken);
  }

  // auth/logout: 204 even for unknown tokens, so it can't be used to probe them.
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT) //204
  logout(@Body() dto: RefreshDTO) {
    return this.authService.logout(dto.refreshToken);
  }
}
