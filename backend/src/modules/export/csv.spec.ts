import { centsToDecimal, toCsv } from './csv';

describe('csv', () => {
  it('formata centavos com vírgula', () => {
    expect(centsToDecimal(123456)).toBe('1234,56');
    expect(centsToDecimal(5)).toBe('0,05');
    expect(centsToDecimal(-1999)).toBe('-19,99');
  });

  it('escapa separador, aspas e quebras de linha', () => {
    expect(toCsv(['a', 'b'], [['x;y', 'diz "oi"']])).toBe('﻿a;b\r\n"x;y";"diz ""oi"""\r\n');
  });
});
