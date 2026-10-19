import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDTO } from './dto/create-user';
import type { User } from '../generated/prisma/client';
import { UpdateUserDTO } from './dto/update-user';
import * as argon2 from 'argon2';

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

  async create(dto: CreateUserDTO): Promise<User> {
    const hash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: {
        ...dto,
        password: hash,
      },
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

  async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }
}
