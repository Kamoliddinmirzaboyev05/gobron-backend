import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Ignore noise from sw.js (Service Worker) 404 errors
    if (status === HttpStatus.NOT_FOUND && request.url.includes('sw.js')) {
      return response.status(status).json({
        statusCode: status,
        message: 'Service Worker not found',
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // Extract error response
    const errorResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof errorResponse === 'object' && (errorResponse as any).message
        ? (errorResponse as any).message
        : errorResponse;

    const errorDetails = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: message,
      // Hide stack trace in production
      stack: isProduction ? undefined : exception?.stack,
    };

    // Detailed logging for Render/Production logs
    this.logger.error(
      `${request.method} ${request.url} [${status}]: ${JSON.stringify(message)}`,
      exception?.stack,
    );

    response.status(status).json(errorDetails);
  }
}
