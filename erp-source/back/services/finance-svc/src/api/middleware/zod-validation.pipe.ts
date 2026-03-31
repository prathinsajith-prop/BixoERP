import { PipeTransform, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';

/** Pipe that validates request body using a Zod schema */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errorMessages = (result.error as ZodError).errors.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        errors: errorMessages,
      });
    }
    return result.data;
  }
}
