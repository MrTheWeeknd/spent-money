import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Model } from 'mongoose';
import { AppSettings } from './app-settings.schema';

export class UpdateSettingsDto {
  /** 1–28, ou null para usar o mês do calendário. */
  @IsOptional()
  @IsInt({ message: 'Dia de virada deve ser um número inteiro' })
  @Min(1, { message: 'Dia de virada deve ser entre 1 e 28' })
  @Max(28, { message: 'Dia de virada deve ser entre 1 e 28' })
  cycleEndDay?: number | null;
}

export interface Settings {
  cycleEndDay: number | null;
}

@Injectable()
export class SettingsService {
  constructor(@InjectModel(AppSettings.name) private readonly model: Model<AppSettings>) {}

  async get(): Promise<Settings> {
    const doc = await this.model.findOne({ key: 'app' }).lean();
    return { cycleEndDay: doc?.cycleEndDay ?? null };
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    await this.model.updateOne(
      { key: 'app' },
      { $set: dto, $setOnInsert: { key: 'app' } },
      { upsert: true },
    );
    return this.get();
  }
}
