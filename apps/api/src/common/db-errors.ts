import { QueryFailedError } from 'typeorm';

// True when Postgres refused a row because of the named unique index.
// For a unique index, the error's `constraint` field holds the index name.
export function isUniqueViolation(err: unknown, index: string): boolean {
  if (!(err instanceof QueryFailedError)) return false;
  const { code, constraint } = err.driverError as {
    code?: string;
    constraint?: string;
  };
  return code === '23505' && constraint === index;
}
