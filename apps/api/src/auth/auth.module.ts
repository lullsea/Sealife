import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

// Groups everything for logging in and issuing tokens.
@Module({
  imports: [
    // AuthService needs UsersService; UsersModule must export it (step 5).
    UsersModule,
    // Makes JwtService injectable in this module, pre-configured with our secret.
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
