import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dto/create-user.dto';
import { User, UserRole } from './user.entity';
import { UpdateUserDTO } from './dto/update-user.dto';
import * as argon2 from 'argon2';

export type PublicUser = Omit<User, 'password' | 'habits' | 'refreshTokens'>;

@Injectable()
export class UsersService {
  // Nest injects the Repository<User> registered by TypeOrmModule.forFeature.
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.users.find();
  }

  async findOne(id: number): Promise<PublicUser> {
    // findOneBy resolves to null (not an error) when no row matches.
    const user = await this.users.findOneBy({ id });
    if (!user) {
      // Nest turns this into a 404 response automatically.
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async create(dto: CreateUserDTO): Promise<PublicUser> {
    const hash = await argon2.hash(dto.password);
    const { id } = await this.users.save(
      this.users.create({ ...dto, password: hash }),
    );
    // Re-read so the response has DB defaults filled in and no password hash.
    return this.findOne(id);
  }

  async update(id: number, dto: UpdateUserDTO): Promise<PublicUser> {
    // preload = load the row and merge dto over it; undefined if it doesn't exist.
    const user = await this.users.preload({ id, ...dto });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return this.users.save(user);
  }

  async delete(id: number): Promise<PublicUser> {
    const user = await this.findOne(id); // 404 if the user doesn't exist
    await this.users.delete(id);
    return user;
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<PublicUser> {
    // select: false hides password; opt back in since we need the hash here.
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await argon2.verify(user.password, password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Strip the hash before the user leaves this method.
    const { password: _, ...publicUser } = user;
    return publicUser;
  }

  // Set the role for a user
  async setRole(
    id: number,
    role: UserRole,
    actorId: number,
  ): Promise<PublicUser> {
    if (id === actorId)
      throw new ForbiddenException(
        'You are not authorized to change your own role.',
      );
    const { affected } = await this.users.update({ id }, { role });
    // In the case where the user wasn't found
    if (!affected) {
      throw new NotFoundException(`User ${id} not found.`);
    }

    return this.findOne(id);
  }
}
