import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Post, Body, Get, Delete, Put } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { UsersService, type PublicUser } from './users.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt-payload';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // GET /users/:id
  @Get('/me')
  findOne(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.userService.findOne(user.id);
  }

  // DELETE /users/:id
  @Delete('/me')
  delete(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.userService.delete(user.id);
  }
  @Put('/me')
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateUserDTO) {
    return this.userService.update(user.id, dto);
  }

  // POST /users
  @Public()
  @Post()
  create(@Body() dto: CreateUserDTO): Promise<PublicUser> {
    return this.userService.create(dto);
  }
}
