import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';

export class EnvVars {
  @IsString()
  @IsNotEmpty()
  MONGODB_URI: string;

  @IsString()
  @IsNotEmpty()
  AUTH_PASSWORD_HASH: string;

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  SESSION_DAYS = 30;

  @IsString()
  CORS_ORIGINS = '';

  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  COOKIE_SECURE = true;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  PORT = 3000;
}

export function validateEnv(config: Record<string, unknown>): EnvVars {
  const env = plainToInstance(EnvVars, config, { exposeDefaultValues: true });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length) {
    const msg = errors.map(
      (e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
    );
    throw new Error(`Variáveis de ambiente inválidas:\n${msg.join('\n')}`);
  }
  return env;
}
