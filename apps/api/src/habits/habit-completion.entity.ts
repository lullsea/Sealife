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

// One completion per habit per period. Postgres refuses a second row with the
// same pair, so two requests at once can't both get in. As a bonus, queries
// by habitId alone can use this index too: it's the leftmost column.
@Index('HabitCompletion_habitId_periodStart_key', ['habitId', 'periodStart'], {
  unique: true,
})
@Entity('HabitCompletion')
export class HabitCompletion {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'HabitCompletion_pkey' })
  id: number;

  @CreateDateColumn({ type: 'timestamptz', precision: 3 })
  completedAt: Date;

  @Column({ type: 'timestamptz', precision: 3 })
  periodStart: Date;

  // The actual foreign key column in the DB.
  // findCompletions(habitId) is `WHERE "habitId" = ?`, so index it.
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
