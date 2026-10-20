import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

// Groups everything for logging in and issuing tokens.
@Module({
  imports: [
    // AuthService needs UsersService; UsersModule exports it.
    UsersModule,
    // AuthService writes RefreshToken rows. Imports aren't inherited, so
    // UsersModule importing PrismaModule doesn't make it available here.
    PrismaModule,
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
