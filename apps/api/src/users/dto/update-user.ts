import { IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateUserDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsString()
  @IsOptional()
  readonly name?: string;
}
