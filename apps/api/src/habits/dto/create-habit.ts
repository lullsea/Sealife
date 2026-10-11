import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateHabitDTO {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @MaxLength(100)
  readonly description?: string;
}
