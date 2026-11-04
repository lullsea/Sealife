import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class QueryFailedExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(QueryFailedExceptionsFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // PostgreSQL-specific error code
    const driverError = exception.driverError as {
      code?: string;
    };

    // let status = HttpStatus.INTERNAL_SERVER_ERROR;
    // let message = 'Internal server error';
    const FIXED_RESPONSES: Record<string, { status: number; message: string }> =
      {
        '23505': {
          status: HttpStatus.CONFLICT,
          message: 'Resource already exists',
        },
        '23503': {
          status: HttpStatus.CONFLICT,
          message: 'Related resource does not exist',
        },
      };

    const fixedResponse = driverError.code
      ? FIXED_RESPONSES[driverError.code]
      : undefined;

    const status = fixedResponse?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const message = fixedResponse?.message ?? 'Internal server error';

    this.logger.debug(`Status: ${status}`);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
