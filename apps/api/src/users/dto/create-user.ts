import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsStrongPassword,
} from 'class-validator';

export class CreateUserDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsString()
  @IsOptional()
  readonly name?: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword()
  readonly password: string;
}
