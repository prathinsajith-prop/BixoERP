import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainException,
  EntityNotFoundException,
  BusinessRuleViolation,
  DuplicateEntryException,
  InvalidNotificationTransition,
  ChannelDisabledException,
} from '../../domain/exceptions/domain.exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: number;
    let code: string;
    let message: string;

    if (exception instanceof EntityNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof BusinessRuleViolation) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof DuplicateEntryException) {
      status = HttpStatus.CONFLICT;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof InvalidNotificationTransition) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof ChannelDisabledException) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof DomainException) {
      status = HttpStatus.BAD_REQUEST;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      code = typeof res === 'object' && (res as any).code ? (res as any).code : 'HTTP_ERROR';
      message = typeof res === 'string' ? res : (res as any).message || exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = 'An unexpected error occurred';
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
