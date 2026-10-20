import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDTO {
  @IsNotEmpty()
  @IsString()
  readonly refreshToken: string;
}
