import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Post,
  Body,
  Get,
  Delete,
  Put,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { UsersService, type PublicUser } from './users.service';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDTO } from './dto/update-user.dto';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/jwt-payload';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from './user.entity';
import { UpdateRoleDTO } from './dto/update-role.dto';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // GET /users/me
  @Get('/me')
  findOne(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.userService.findOne(user.id);
  }

  // DELETE /users/me
  @Delete('/me')
  delete(@CurrentUser() user: AuthUser): Promise<PublicUser> {
    return this.userService.delete(user.id);
  }

  // PUT /users/me
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

  // GET /users (admin)
  @Roles(UserRole.ADMIN)
  @Get()
  findAll(): Promise<PublicUser[]> {
    return this.userService.findAll();
  }

  // GET /users/:id (admin)
  @Roles(UserRole.ADMIN)
  @Get(':id')
  findOneAdmin(@Param('id', ParseIntPipe) id: number): Promise<PublicUser> {
    return this.userService.findOne(id);
  }

  // PUT /users/:id/role (admin) with body { "role": "USER" | "ADMIN" }
  @Roles(UserRole.ADMIN)
  @Put(':id/role')
  setRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDTO,
    @CurrentUser() admin: AuthUser,
  ): Promise<PublicUser> {
    return this.userService.setRole(id, dto.role, admin.id);
  }

  // DELETE /users/:id (admin)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deleteAdmin(@Param('id', ParseIntPipe) id: number): Promise<PublicUser> {
    return this.userService.delete(id);
  }
}
