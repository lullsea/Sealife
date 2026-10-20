import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login';
import { RefreshDTO } from './dto/refresh';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK) // 200
  login(@Body() dto: LoginDTO) {
    return this.authService.login(dto);
  }

  // auth/refresh: swaps a refresh token for a new pair. Nothing is created, so 200.
  @Post('refresh')
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
