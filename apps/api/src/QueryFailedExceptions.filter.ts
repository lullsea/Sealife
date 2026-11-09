import {
  ArgumentsHost,
  Catch,
  ConflictException,
  type HttpException,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

// Postgres error codes (SQLSTATE) with a known meaning for the client.
// Anything not listed here is a bug, not something to translate.
const FIXED_RESPONSES: Record<string, () => HttpException> = {
  // unique_violation: e.g. signing up with an email that's taken
  '23505': () => new ConflictException('Resource already exists'),
  // foreign_key_violation: e.g. a row pointing at a user who was just deleted
  '23503': () => new ConflictException('Related resource does not exist'),
};

// BaseExceptionFilter is Nest's own error handler. Handing everything to it
// keeps one response shape for every error, and it logs unknown errors with
// their stack before answering 500.
@Catch(QueryFailedError)
export class QueryFailedExceptionsFilter extends BaseExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const { code } = exception.driverError as { code?: string };
    const fixed = code ? FIXED_RESPONSES[code] : undefined;
    super.catch(fixed ? fixed() : exception, host);
  }
}
