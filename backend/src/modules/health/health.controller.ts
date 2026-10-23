import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { Public } from '../../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly conn: Connection) {}

  @Public()
  @Get()
  check() {
    return { ok: true, db: this.conn.readyState === 1 ? 'up' : 'down' };
  }
}
