import { ConfigService } from '@nestjs/config';
import { createApp } from './bootstrap';

async function main() {
  const app = await createApp();
  const port = app.get(ConfigService).get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`API em http://localhost:${port}/api`);
}
void main();
