import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDTO } from './create-user.dto';

// Password changes go through the dedicated reset-password endpoint.
export class UpdateUserDTO extends PartialType(
  OmitType(CreateUserDTO, ['password'] as const),
) {}
