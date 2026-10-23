import { BadRequestException, ValidationError } from '@nestjs/common';

// Mensagens padrão em PT-BR por tipo de regra. Mensagens definidas no próprio
// decorator (ex.: @IsNotEmpty({ message })) têm prioridade.
const messages: Record<string, (field: string) => string> = {
  whitelistValidation: (f) => `Campo não permitido: ${f}`,
  isDefined: (f) => `${f} é obrigatório`,
  isNotEmpty: (f) => `${f} é obrigatório`,
  isString: (f) => `${f} deve ser texto`,
  isInt: (f) => `${f} deve ser um número inteiro`,
  isNumber: (f) => `${f} deve ser um número`,
  isBoolean: (f) => `${f} deve ser verdadeiro ou falso`,
  isEnum: (f) => `${f} tem um valor inválido`,
  isIn: (f) => `${f} tem um valor inválido`,
  isMongoId: (f) => `${f} não é um id válido`,
  isDate: (f) => `${f} deve ser uma data`,
  isDateString: (f) => `${f} deve ser uma data`,
  isISO8601: (f) => `${f} deve ser uma data`,
  isArray: (f) => `${f} deve ser uma lista`,
  min: (f) => `${f} está abaixo do mínimo`,
  max: (f) => `${f} está acima do máximo`,
  minLength: (f) => `${f} é curto demais`,
  maxLength: (f) => `${f} é longo demais`,
  matches: (f) => `${f} está em formato inválido`,
  isHexColor: (f) => `${f} deve ser uma cor hexadecimal`,
};

function flatten(errors: ValidationError[], parent = ''): string[] {
  return errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property;
    const own = Object.entries(e.constraints ?? {}).map(([rule, original]) => {
      // class-validator gera mensagens em inglês começando pelo nome do campo;
      // se a mensagem não segue esse padrão, ela foi customizada no decorator.
      const isDefault = original.startsWith(e.property) || rule === 'whitelistValidation';
      return isDefault && messages[rule] ? messages[rule](field) : original;
    });
    return [...own, ...flatten(e.children ?? [], field)];
  });
}

export function validationExceptionFactory(errors: ValidationError[]) {
  return new BadRequestException({ message: flatten(errors) });
}
