import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
// Prisma generates a runtime object AND a type with the same name, so this one
// import works both as a value (for @IsEnum) and as a type annotation.
import { HabitFrequency } from '../../generated/prisma/enums';

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
}
