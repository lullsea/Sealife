import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDTO } from './create-user';

// Password changes go through the dedicated reset-password endpoint.
export class UpdateUserDTO extends PartialType(
  OmitType(CreateUserDTO, ['password'] as const),
) {}
