// Uso:
//   npm run hash-password -- "minha senha"           → imprime a linha para colar (ex.: na Vercel)
//   npm run hash-password -- "minha senha" --write   → grava direto no backend/.env
// Depois de trocar, reinicie a API: o .env só é lido na inicialização.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const args = process.argv.slice(2);
const write = args.includes('--write');
const password = args.find((a) => a !== '--write');
if (!password) {
  console.error('Uso: npm run hash-password -- "minha senha" [--write]');
  process.exit(1);
}

const line = `AUTH_PASSWORD_HASH=${bcrypt.hashSync(password, 10)}`;
if (!write) {
  console.log(line);
  process.exit(0);
}

const envPath = path.join(__dirname, '..', '.env');
const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const next = /^AUTH_PASSWORD_HASH=.*$/m.test(current)
  ? current.replace(/^AUTH_PASSWORD_HASH=.*$/m, line)
  : `${current.replace(/\s*$/, '\n')}${line}\n`;
fs.writeFileSync(envPath, next);
console.log('Senha atualizada em backend/.env. Reinicie a API para valer.');
