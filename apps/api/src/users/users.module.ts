import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { TokenRevocationModule } from '../auth/token-revocation.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), TokenRevocationModule], // makes Repository<User> injectable here
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // lets AuthModule inject it
})
export class UsersModule {}
