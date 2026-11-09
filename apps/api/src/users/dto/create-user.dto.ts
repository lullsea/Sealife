import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsStrongPassword,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Matches(/^[^\u0000]*$/)
  readonly email: string;

  @IsString()
  @IsOptional()
  // Filters out NUL bytes in string
  @Matches(/^[^\u0000]*$/)
  readonly name?: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  @MinLength(8)
  readonly password: string;
}
