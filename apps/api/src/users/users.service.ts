import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDTO } from './dto/create-user';
import type { User } from '../generated/prisma/client';
import { UpdateUserDTO } from './dto/update-user';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // SELECT * FROM "User"
  findAll(): Promise<User[]> {
    return this.prisma.user.findMany({});
  }

  async findOne(id: number): Promise<User> {
    // findUnique resolves to null (not an error) when no row matches.
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      // Nest turns this into a 404 response automatically.
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  create(dto: CreateUserDTO): Promise<User> {
    return this.prisma.user.create({
      data: dto,
    });
  }

  update(id: number, dto: UpdateUserDTO): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  delete(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
