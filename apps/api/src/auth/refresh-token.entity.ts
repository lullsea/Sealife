import { ApiHideProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('RefreshToken')
export class RefreshToken {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'RefreshToken_pkey' })
  id: number;

  // Only the SHA-256 hash is stored, never the raw token. Unique so we can
  // look a token up by its hash.
  @ApiHideProperty()
  @Index('RefreshToken_tokenHash_key', { unique: true })
  @Column({ type: 'text' })
  tokenHash: string;

  // revokeAllForUser is `WHERE "userId" = ?`, so index it.
  @Index('RefreshToken_userId_idx')
  @Column({ type: 'integer' })
  userId: number;

  // onDelete: CASCADE = deleting a User deletes their refresh tokens.
  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'userId',
    foreignKeyConstraintName: 'RefreshToken_userId_fkey',
  })
  user: Relation<User>;

  @Column({ type: 'timestamp', precision: 3 })
  expiresAt: Date;

  @Column({ type: 'timestamp', precision: 3, nullable: true }) // null = still usable
  revokedAt: Date | null;

  @CreateDateColumn({ type: 'timestamp', precision: 3 })
  createdAt: Date;
}
