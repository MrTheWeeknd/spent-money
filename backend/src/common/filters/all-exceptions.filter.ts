import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Error as MongooseError } from 'mongoose';

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  details?: string[];
}

/** Padroniza todas as respostas de erro em { statusCode, message, details? }. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const body = this.toBody(exception);
    if (body.statusCode >= 500) this.logger.error(exception);
    res.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const r = exception.getResponse();
      if (typeof r === 'string') return { statusCode, message: r };
      const m = (r as { message?: string | string[] }).message;
      if (Array.isArray(m)) return { statusCode, message: 'Dados inválidos', details: m };
      return { statusCode, message: m ?? exception.message };
    }
    if (exception instanceof MongooseError.ValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Dados inválidos',
        details: Object.values(exception.errors).map((e) => e.message),
      };
    }
    if (exception instanceof MongooseError.CastError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Valor inválido para ${exception.path}`,
      };
    }
    if ((exception as { code?: number })?.code === 11000) {
      return { statusCode: HttpStatus.CONFLICT, message: 'Já existe um registro com esse nome' };
    }
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Erro interno' };
  }
}
