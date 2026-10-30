import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { User } from '../users/user.entity';
import { HabitCompletion } from './habit-completion.entity';
import { HabitFrequency } from './habit-frequency.enum';

@Entity('Habit')
export class Habit {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'Habit_pkey' }) // DB assigns 1, 2, 3…
  id: number;

  @Column({ type: 'text' }) // required (NOT NULL)
  name: string;

  @Column({
    type: 'enum',
    enum: HabitFrequency,
    enumName: 'HabitFrequency', // reuse the existing Postgres enum type
    nullable: true,
  })
  frequency: HabitFrequency | null;

  @Column({ type: 'boolean', default: false })
  archived: boolean;

  @Column({ type: 'text', nullable: true }) // nullable = optional
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 }) // DB fills in the timestamp
  createdAt: Date;

  // Back-reference: not a column, just lets you load `relations: { completions: true }`.
  @OneToMany(() => HabitCompletion, (completion) => completion.habit)
  completions: Relation<HabitCompletion>[];

  // The actual foreign key column. Declared explicitly so it can be set and
  // read directly, without loading the User.
  // Postgres does NOT index foreign keys automatically, so index it.
  @Index('Habit_userId_idx')
  @Column({ type: 'integer' })
  userId: number;

  // onDelete: CASCADE = deleting a User deletes their habits.
  @ManyToOne(() => User, (user) => user.habits, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', foreignKeyConstraintName: 'Habit_userId_fkey' })
  user: Relation<User>;
}
