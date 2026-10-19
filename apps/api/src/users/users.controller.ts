import {
  Post,
  Body,
  ParseIntPipe,
  Param,
  Get,
  Delete,
  Put,
} from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { UsersService, type PublicUser } from './users.service';
import { CreateUserDTO } from './dto/create-user';
import { UpdateUserDTO } from './dto/update-user';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // GET /users
  @Get()
  findAll(): Promise<PublicUser[]> {
    return this.userService.findAll();
  }

  // GET /users/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<PublicUser> {
    return this.userService.findOne(id);
  }

  // POST /users
  @Post()
  create(@Body() dto: CreateUserDTO): Promise<PublicUser> {
    return this.userService.create(dto);
  }

  // DELETE /users/:id
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number): Promise<PublicUser> {
    return this.userService.delete(id);
  }
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDTO) {
    return this.userService.update(id, dto);
  }
}
