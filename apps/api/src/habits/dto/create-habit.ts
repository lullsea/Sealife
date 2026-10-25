import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
// A TS enum is a runtime object AND a type, so this one import works both
// as a value (for @IsEnum) and as a type annotation.
import { HabitFrequency } from '../habit-frequency.enum';

export class CreateHabitDTO {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  readonly description?: string;

  // @IsOptional() skips all other validators when the value is undefined/null.
  // Without it, omitting the field fails @IsEnum with "must be one of ...".
  // @IsEnum checks the value is one of DAILY | WEEKLY | MONTHLY.
  @IsOptional()
  @IsEnum(HabitFrequency)
  readonly frequency?: HabitFrequency;

  // Habit.userId is a required FK (NOT NULL), so every habit needs an owner.
  // @IsInt() rejects "abc" and 1.5; a nonexistent id still passes validation
  // and fails at the DB with a foreign key violation.
  // TEMPORARY: in Stage 3 the owner comes from the JWT, not the body.
  @IsInt()
  readonly userId: number;
}
