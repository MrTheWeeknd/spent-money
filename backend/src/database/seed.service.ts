import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { CategoriesService } from '../modules/categories/categories.service';
import { PeopleService } from '../modules/people/people.service';

/**
 * Dados obrigatórios: pessoa "Eu" e categorias padrão. Roda a cada inicialização
 * (inclusive cold start na Vercel) e é idempotente, então custa só duas consultas.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly people: PeopleService,
    private readonly categories: CategoriesService,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.ensureDefaults();
    } catch (e) {
      this.logger.error('Falha ao garantir dados padrão', e);
    }
  }

  async ensureDefaults() {
    await Promise.all([this.people.ensureSelf(), this.categories.ensureDefaults()]);
  }
}
