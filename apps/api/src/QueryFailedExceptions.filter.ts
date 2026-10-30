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
    const FIXED_RESPONSES = {
      '23505': {
        status: HttpStatus.CONFLICT,
        message: 'Resource already exists',
      },
      '23503': {
        status: HttpStatus.CONFLICT,
        message: 'Related resource does not exist',
      },
    };

    const {
      status = HttpStatus.INTERNAL_SERVER_ERROR,
      message = 'Internal server error',
    } = FIXED_RESPONSES[driverError.code as keyof unknown];

    this.logger.debug(`Status: ${status}`);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
