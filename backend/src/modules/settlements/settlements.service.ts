import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { parseLocalDate, storedDate } from '../../common/dates';
import { Person } from '../people/person.schema';
import { CreateSettlementDto } from './settlement.dto';
import { Settlement } from './settlement.schema';

@Injectable()
export class SettlementsService {
  constructor(
    @InjectModel(Settlement.name) private readonly model: Model<Settlement>,
    @InjectModel(Person.name) private readonly people: Model<Person>,
  ) {}

  list(personId?: string) {
    return this.model
      .find(personId ? { personId: new Types.ObjectId(personId) } : {})
      .sort({ date: -1, createdAt: -1 })
      .exec();
  }

  async create(dto: CreateSettlementDto) {
    const person = await this.people.findById(dto.personId).lean();
    if (!person) throw new BadRequestException('Pessoa não encontrada');
    if (person.isSelf) throw new BadRequestException('Acertos são só para terceiros');
    let date;
    try {
      date = storedDate(parseLocalDate(dto.date));
    } catch {
      throw new BadRequestException('Data inválida');
    }
    return this.model.create({ ...dto, personId: person._id, date, note: dto.note || undefined });
  }

  async remove(id: string) {
    const res = await this.model.deleteOne({ _id: id });
    if (!res.deletedCount) throw new NotFoundException('Acerto não encontrado');
  }
}
