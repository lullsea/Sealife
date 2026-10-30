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
import { Habit } from './habit.entity';

@Entity('HabitCompletion')
export class HabitCompletion {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'HabitCompletion_pkey' })
  id: number;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  completedAt: Date;

  // The actual foreign key column in the DB.
  // findCompletions(habitId) is `WHERE "habitId" = ?`, so index it.
  @Index('HabitCompletion_habitId_idx')
  @Column({ type: 'integer' })
  habitId: number;

  // Relation field: not a column. Maps habitId -> Habit.id.
  // onDelete: CASCADE = deleting a Habit deletes its completions.
  @ManyToOne(() => Habit, (habit) => habit.completions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'habitId',
    foreignKeyConstraintName: 'HabitCompletion_habitId_fkey',
  })
  habit: Relation<Habit>;
}
