import { Post, Body, ParseIntPipe, Param, Get, Delete } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { User } from '../generated/prisma/client';
import { UsersService } from './users.service';
import { CreateUserDTO } from './dto/create-user';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // GET /users
  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  // GET /users/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  // POST /users
  @Post()
  create(@Body() dto: CreateUserDTO): Promise<User> {
    return this.userService.create(dto);
  }

  // DELETE /users/:id
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.delete(id);
  }
}
