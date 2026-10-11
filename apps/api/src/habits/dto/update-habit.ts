import { PartialType } from '@nestjs/mapped-types';
import { CreateHabitDTO } from './create-habit';
import { IsBoolean, IsOptional } from 'class-validator';

// PartialType copies every property AND its validation decorators from
// CreateHabitDTO, then marks each one optional (as if @IsOptional() were added).
// So `name` is still checked with @IsString() + @IsNotEmpty() when present,
// but a body without `name` is valid. Only the fields sent get validated.
//
// One class, one source of truth: add a field to CreateHabitDTO and
// UpdateHabitDTO gets it for free.
export class UpdateHabitDTO extends PartialType(CreateHabitDTO) {
  @IsBoolean()
  @IsOptional()
  readonly archived: boolean;
}
