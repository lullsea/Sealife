import { ApiHideProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Habit } from '../habits/habit.entity';
import { RefreshToken } from '../auth/refresh-token.entity';

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Table and constraint names match the schema Prisma created, so existing
// databases keep working and migration:generate shows no spurious diff.
@Entity('User')
export class User {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'User_pkey' })
  id: number;

  @Index('User_email_key', { unique: true })
  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', nullable: true })
  name: string | null;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  createdAt: Date;

  // select: false = left out of every query unless explicitly asked for.
  @ApiHideProperty()
  @Column({ type: 'text', select: false })
  password: string;

  // Back-reference: not a column, only loaded when you ask for the relation.
  @OneToMany(() => Habit, (habit) => habit.user)
  habits: Relation<Habit>[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: Relation<RefreshToken>[];

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'UserRole',
    default: UserRole.USER,
  })
  role: UserRole;
}
