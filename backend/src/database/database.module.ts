import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvVars } from '../config/env.validation';

/**
 * A conexão pertence à instância do app Nest. Em serverless o app é criado uma vez
 * por container (ver api/index.js) e reaproveitado entre invocações, então a conexão também.
 */
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvVars, true>) => ({
        uri: config.get('MONGODB_URI'),
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 8000,
        autoIndex: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
