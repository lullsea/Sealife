import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { RefreshToken } from './refresh-token.entity';
import { AuthGuard } from './auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ACCESS_TOKEN_TTL_SECONDS } from './jwt-payload';
import { TokenRevocationModule } from './token-revocation.module';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.validation';

// Groups everything for logging in and issuing tokens.
@Module({
  imports: [
    // AuthService needs UsersService; UsersModule exports it.
    UsersModule,
    // AuthService writes RefreshToken rows; makes Repository<RefreshToken> injectable here.
    TypeOrmModule.forFeature([RefreshToken]),
    // Makes JwtService injectable in this module, pre-configured with our secret.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: { expiresIn: ACCESS_TOKEN_TTL_SECONDS },
      }),
    }),
    TokenRevocationModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
