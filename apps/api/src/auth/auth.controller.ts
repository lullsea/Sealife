import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDTO } from './dto/login';

// Every route here starts with /auth. POST /auth/login comes in step 8.
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // auth/login
  @Post('login')
  login(@Body() dto: LoginDTO) {
    return this.authService.login(dto);
  }
}
