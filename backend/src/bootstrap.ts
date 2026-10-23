import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validationExceptionFactory } from './common/validation/exception-factory';
import { EnvVars } from './config/env.validation';

/** Cria e configura o app. Compartilhado entre execução local (main.ts) e Vercel (api/index.js). */
export async function createApp(): Promise<INestApplication> {
  // Na Vercel cada cold start logaria todas as rotas; lá ficam só avisos e erros.
  const app = await NestFactory.create(AppModule, {
    logger: process.env.VERCEL ? ['error', 'warn'] : ['error', 'warn', 'log'],
  });
  const config = app.get<ConfigService<EnvVars, true>>(ConfigService);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const origins = config
    .get<string>('CORS_ORIGINS')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });

  return app;
}
