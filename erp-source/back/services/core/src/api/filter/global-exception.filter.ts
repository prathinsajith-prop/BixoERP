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
  InvalidCredentialsException,
  AccountLockedException,
  AccountInactiveException,
  DuplicateEmailException,
  TokenExpiredException,
  TokenRevokedException,
  InsufficientPermissionsException,
} from '../../domain/exception/domain.exceptions';
import {
  InvalidTwoFactorCodeException,
  TwoFactorAlreadyEnabledException,
  TwoFactorNotEnabledException,
} from '../../application/use-case/two-factor.use-case';
import {
  SocialLoginException,
  SocialProviderNotConfiguredException,
} from '../../application/use-case/social-login.use-case';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string' ? exResponse : (exResponse as any).message ?? message;
      code = (exResponse as any).code ?? 'HTTP_ERROR';
    } else if (exception instanceof EntityNotFoundException) {
      status = HttpStatus.NOT_FOUND;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof InvalidCredentialsException) {
      status = HttpStatus.UNAUTHORIZED;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof AccountLockedException) {
      status = HttpStatus.FORBIDDEN;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof AccountInactiveException) {
      status = HttpStatus.FORBIDDEN;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof DuplicateEmailException) {
      status = HttpStatus.CONFLICT;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof TokenExpiredException) {
      status = HttpStatus.UNAUTHORIZED;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof TokenRevokedException) {
      status = HttpStatus.UNAUTHORIZED;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof InsufficientPermissionsException) {
      status = HttpStatus.FORBIDDEN;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof InvalidTwoFactorCodeException) {
      status = HttpStatus.UNAUTHORIZED;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof TwoFactorAlreadyEnabledException) {
      status = HttpStatus.CONFLICT;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof TwoFactorNotEnabledException) {
      status = HttpStatus.BAD_REQUEST;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof SocialLoginException) {
      status = HttpStatus.UNAUTHORIZED;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof SocialProviderNotConfiguredException) {
      status = HttpStatus.BAD_REQUEST;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof DomainException) {
      status = HttpStatus.BAD_REQUEST;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
