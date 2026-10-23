import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ParseIdPipe } from '../../common/pipes/parse-id.pipe';
import { CreateAccountDto, UpdateAccountDto } from './account.dto';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  list() {
    return this.accounts.list();
  }

  @Get(':id')
  get(@Param('id', ParseIdPipe) id: string) {
    return this.accounts.get(id);
  }

  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accounts.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIdPipe) id: string, @Body() dto: UpdateAccountDto) {
    return this.accounts.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIdPipe) id: string) {
    return this.accounts.remove(id);
  }
}
