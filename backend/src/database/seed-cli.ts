// Uso: npm run seed (dados padrão) | npm run seed:demo (padrão + exemplos)
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DemoSeedService } from './demo-seed.service';
import { SeedService } from './seed.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  await app.get(SeedService).ensureDefaults();
  if (process.argv.includes('--demo')) await app.get(DemoSeedService).run();
  await app.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
