import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDTO } from './dto/login';

// Checks credentials and signs tokens. login() comes in step 7.
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // /auth/login
  async login({ email, password }: LoginDTO): Promise<{ accessToken: string }> {
    const user = await this.usersService.validateCredentials(email, password);

    const token = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken: token,
    };
  }
}
