import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaClientKnownRequestError } from 'src/generated/prisma/internal/prismaNamespace';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        status = HttpStatus.CONFLICT;

        const { cause } = exception.meta?.driverAdapterError as {
          cause?: { constraint?: { fields?: string[] } };
        };

        const constraintFields = cause?.constraint?.fields;

        // Prisma 7 stores constraint info in driverAdapterError
        const fieldName =
          constraintFields?.join(', ') ||
          (exception.meta?.target as string[])?.join(', ') ||
          'field';

        message = `A record with this ${fieldName} already exists`;
        break;
      }
      case 'P2025':
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message = 'Record not found';
        break;
      case 'P2003':
        // Foreign key constraint violation
        status = HttpStatus.BAD_REQUEST;
        message = 'Invalid reference to related record';
        break;
      default:
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database error occurred';
    }

    response.status(status).json({
      statusCode: status,
      message,
      error: exception.code,
    });
  }
}
