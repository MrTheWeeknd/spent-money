import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { PeopleService } from './people.service';
import { CreatePersonDto, UpdatePersonDto } from './person.dto';

@Controller('people')
export class PeopleController {
  constructor(private readonly people: PeopleService) {}

  @Get()
  list() {
    return this.people.list();
  }

  @Get(':id')
  get(@Param('id', ParseIdPipe) id: string) {
    return this.people.get(id);
  }

  @Post()
  create(@Body() dto: CreatePersonDto) {
    return this.people.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: string, @Body() dto: UpdatePersonDto) {
    return this.people.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIdPipe) id: string) {
    return this.people.remove(id);
  }
}
