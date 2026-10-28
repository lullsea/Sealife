import { IsEnum } from 'class-validator';
import { UserRole } from '../user.entity';

export class UpdateRoleDTO {
  @IsEnum(UserRole)
  readonly role: UserRole;
}
