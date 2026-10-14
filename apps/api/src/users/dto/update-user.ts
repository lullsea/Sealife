import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';
import { CreateHabitDTO } from '../../habits/dto/create-habit';
import { PartialType } from '@nestjs/mapped-types';

export class UpdateUserDTO extends PartialType(CreateHabitDTO) {
  @IsString()
  @IsOptional()
  readonly name?: string;
}
