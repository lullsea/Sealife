import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])], // makes Repository<User> injectable here
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // lets AuthModule inject it
})
export class UsersModule {}
