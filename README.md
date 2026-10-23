# Quanto Deu

App pessoal de controle financeiro ("a pergunta que todo mundo faz no fim do mês"): receitas, despesas, faturas de cartão e gastos de terceiros que usam meus cartões. Feito para iPhone (Safari e PWA na tela inicial), funciona em qualquer navegador.

| | |
|---|---|
| **Backend** | NestJS 11 + TypeScript + Mongoose (MongoDB Atlas), class-validator, JWT em cookie httpOnly |
| **Frontend** | React 19 + Vite + Tailwind 4 + TanStack Query + React Router + React Hook Form + Zod, Radix, vaul, sonner, lucide |
| **Deploy** | Dois projetos na Vercel (frontend estático + backend como função serverless) |

```
backend/   API em /api (módulos: auth, cards, people, categories, accounts, transactions,
           installments, invoices, settlements, balances, reports, export)
frontend/  PWA (Início, Lançamentos, lançamento rápido, Cartões, Pessoas, Receitas, Relatórios, Ajustes)
```

## Regras principais

- **Foco no cartão de crédito.** O lançamento rápido sempre começa no último cartão usado; débito, Pix e dinheiro ficam em "Outro meio". O Início mostra as **faturas que vencem no mês** ("quanto deu"), quanto cada pessoa gastou nelas e o status de cada cartão, abrindo no mês da próxima fatura a pagar.

- **Dinheiro em centavos** (inteiros) no banco e na API; formatação em reais só na tela.
- **Datas em UTC** no banco; dia/mês/fatura calculados no fuso **America/Manaus**. Um lançamento é guardado ao meio-dia local do dia escolhido.
- **Cartões:** só apelido, bandeira e 4 últimos dígitos. A API rejeita qualquer outro campo (número, CVV, validade).
- **Fatura:** compra **no dia do fechamento ou depois** cai na fatura seguinte. A fatura leva o nome do **mês de vencimento**. Dia inexistente no mês (ex.: 31) usa o último dia.
- **Meu mês (balanço pessoal):** ciclo que fecha num dia configurável em Ajustes (aqui: dia 2 → ciclo de outubro = 03/10 a 02/11). Soma o que entrou no período e **quanto EU gastei**: minha parte nas faturas que vencem no ciclo (pelo dia de vencimento do cartão, mesmo que o banco empurre para o dia útil seguinte) + Pix/débito/dinheiro meus no período. Gastos de terceiros aparecem à parte.
- **Fim de semana e feriado:** o vencimento efetivo é levado ao próximo dia útil bancário (fins de semana, feriados nacionais, Carnaval, Sexta-feira Santa e Corpus Christi). Quando o banco muda o fechamento ou o vencimento de um mês, use **"O banco mudou as datas? Ajustar"** na fatura: vale só para aquela fatura, e mudar o fechamento redistribui as compras entre as faturas automaticamente. Feriados estaduais e municipais não entram no cálculo automático; use o ajuste manual.
- **Parcelas:** geradas automaticamente. A diferença do arredondamento vai na última parcela. Editar ou excluir a compra recria ou remove as parcelas. Mudar o fechamento/vencimento do cartão recalcula as faturas.
- **Recorrentes (mensal):** geram os próximos 12 meses como *previsto*; marque como pago/recebido. A edição pode valer para "só este" ou "este e próximos".
- **Pagamento de fatura:** total ou parcial, com conta opcional. Quando quita, a fatura fica *Paga* e os lançamentos previstos dela viram confirmados. O pagamento **não** é despesa nova (as compras já contaram no mês da fatura). Fatura vencida e não paga aparece em destaque em Cartões.
- **Saldo devedor de terceiros** = gastos atribuídos à pessoa (parcelas no crédito + débito/Pix/dinheiro, só confirmados) − acertos.
- **Relatórios:** crédito conta no mês da fatura; débito/Pix/dinheiro no mês da data. Gastos de terceiros aparecem à parte e não entram nas "minhas despesas".

## Rodando localmente

Requisitos: Node 20+ e um cluster no MongoDB Atlas (o gratuito serve).

### 1. MongoDB Atlas

1. Crie um cluster em [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database Access** → *Add New Database User*: usuário e senha fortes, papel *Read and write to any database*.
3. **Network Access** → *Add IP Address*: o seu IP para desenvolvimento. Para a Vercel, que não tem IP fixo, use `0.0.0.0/0`. A proteção fica por conta do usuário e da senha.
4. **Connect → Drivers** → copie a string `mongodb+srv://...` e acrescente o nome do banco antes do `?`, por exemplo `.../spent-money?retryWrites=true&w=majority`.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run hash-password -- "sua senha de login" --write   # grava AUTH_PASSWORD_HASH no .env
```

Preencha o `.env`:

| Variável | Valor |
|---|---|
| `MONGODB_URI` | string do Atlas com o nome do banco |
| `AUTH_PASSWORD_HASH` | gravado pelo comando acima (sem `--write`, ele só imprime a linha para colar) |
| `JWT_SECRET` | string longa e aleatória, ex.: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `SESSION_DAYS` | duração da sessão (padrão 30) |
| `CORS_ORIGINS` | `http://localhost:5173` |
| `COOKIE_SECURE` | `false` local (permite http); **`true` em produção** |

```bash
npm run dev          # API em http://localhost:3000/api (recarrega ao salvar)
npm test             # testes das regras: fatura, parcelas, saldo devedor, datas, recorrência, CSV
npm run lint
```

A pessoa **"Eu"** e as **categorias padrão em PT-BR** são criadas sozinhas quando a API sobe (só se não existirem).

**Dados de exemplo (opcional):** `npm run seed:demo` cria 2 cartões, 2 pessoas, 2 contas e, se o banco ainda não tiver lançamentos, cerca de 16 lançamentos (parcelados, recorrentes, de terceiros) e um acerto. Para não misturar com seus dados reais, rode contra outro banco:

```bash
MONGODB_URI="mongodb+srv://.../spent-money-demo?retryWrites=true&w=majority" npm run seed:demo
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 — o Vite faz proxy de /api para localhost:3000
```

Deixe `VITE_API_URL` **vazio** no `frontend/.env`: o app chama `/api` no mesmo domínio. Para apontar o proxy para outra API local, use `API_PROXY=http://localhost:3001 npm run dev`.

**No iPhone pela rede local:** abra `http://IP-DO-PC:5173` no Safari (o Vite já escuta na rede). Com `COOKIE_SECURE=false` o login funciona via http. O service worker do PWA só registra em https ou localhost, então para testar a instalação use o deploy.

## Identidade visual

Duas identidades, escolhidas em **Ajustes → Identidade visual** (a escolha fica salva no aparelho):

| | Geométrico (padrão) | Lúdico |
|---|---|---|
| Ideia | o sol nascendo sobre a linha do horizonte | um olho aberto, outro piscando |
| Cores | Petróleo `#0F4C4A`, Coral `#E2643F`, Grafite `#1F2A29`, Areia `#F5EFE3` | Tinta `#141418`, Lilás `#7A68F0`, Chumbo `#6A6A76`, Gelo `#F3F3F6` |
| Fonte de títulos | Manrope ExtraBold | Space Grotesk Bold |

Os tokens ficam em [`frontend/src/index.css`](frontend/src/index.css) (`[data-brand="…"]`, com claro e escuro). Os ícones ficam em `frontend/public/brand/<marca>/`; para regenerá-los a partir dos SVGs, rode `npx pwa-assets-generator` em `frontend/`. No iPhone, o ícone da tela de início é o da identidade ativa **no momento em que o app é adicionado**: troque antes de instalar, ou remova e adicione de novo.

## Deploy na Vercel

São **dois projetos** do mesmo repositório. O frontend repassa `/api/*` para o backend, assim o cookie de sessão fica no **mesmo domínio** do app. Isso é obrigatório no iPhone: o Safari bloqueia cookies de terceiros, e o login não funcionaria com o front e a API em domínios `.vercel.app` diferentes.

### Backend

1. Vercel → *Add New Project* → importe o repositório → **Root Directory: `backend`**.
2. Framework Preset: **Other**. O [`backend/vercel.json`](backend/vercel.json) já define `npm run build` e a função [`api/index.js`](backend/api/index.js).
3. Environment Variables:
   - `MONGODB_URI`, `AUTH_PASSWORD_HASH`, `JWT_SECRET`, `SESSION_DAYS=30`
   - `COOKIE_SECURE=true`
   - `CORS_ORIGINS=https://SEU-FRONT.vercel.app` (opcional com o rewrite, mas recomendado)
4. Deploy. Teste em `https://SEU-BACKEND.vercel.app/api/health` → `{"ok":true,"db":"up"}`.

A função cria o app Nest **uma vez por container** e reaproveita o app e a conexão do Mongo nas invocações seguintes. Só o cold start conecta ao Atlas (cerca de 2–3 s).

### Frontend

1. Edite [`frontend/vercel.json`](frontend/vercel.json) e troque a URL do backend se ela mudar (hoje: `spent-money-backend.vercel.app`).
2. *Add New Project* → mesmo repositório → **Root Directory: `frontend`** → Framework **Vite**.
3. Não defina `VITE_API_URL`.
4. Deploy e abra a URL no Safari do iPhone → **Compartilhar → Adicionar à Tela de Início**.

### Checklist de segurança

- Senha do usuário do Atlas forte e exclusiva; `JWT_SECRET` longo e diferente do de desenvolvimento.
- `COOKIE_SECURE=true` em produção.
- **Trocar a senha de login:** local, `npm run hash-password -- "nova senha" --write` e **reinicie a API** (o `.env` só é lido na inicialização; o modo `dev` não recarrega com mudanças no `.env`). Na Vercel, gere a linha sem `--write`, atualize `AUTH_PASSWORD_HASH` e faça redeploy. Para derrubar sessões abertas, troque também o `JWT_SECRET`.
- Os dados financeiros nunca vão para o cache do service worker (`/api` é sempre *network only*).

## API (resumo)

Todas as rotas ficam sob `/api` e exigem sessão, exceto `POST /auth/login`, `POST /auth/logout` e `GET /health`. Erros sempre no formato `{ statusCode, message, details? }`, em português.

| Rota | Uso |
|---|---|
| `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` | sessão |
| `GET/POST/PATCH/DELETE /cards`, `/people`, `/categories`, `/accounts` | cadastros (exclusão bloqueada com 409 se houver lançamentos) |
| `GET /transactions?month=AAAA-MM&type&cardId&personId&categoryId&status&q` | lista (com `q` e sem `month`, busca no histórico) |
| `POST /transactions` · `PATCH/DELETE /transactions/:id?scope=one\|future` | lançamentos e recorrências |
| `GET /transactions/defaults` | últimos usados e histórico de descrições (lançamento rápido) |
| `GET /invoices` · `GET /invoices/:cardId/:AAAA-MM` | faturas por cartão (total, pago, restante, status) |
| `PUT /invoices/:cardId/:AAAA-MM/dates` | datas reais da fatura (`closingDate`/`dueDate`; `null` volta ao padrão do cartão) |
| `POST /invoices/:cardId/:AAAA-MM/payments` · `DELETE /invoices/payments/:id` | pagamento da fatura (total ou parcial) |
| `GET /balances` · `GET /balances/:personId/statement` | saldo devedor e extrato |
| `GET/POST/DELETE /settlements` | acertos |
| `GET /reports/dashboard?month` · `/reports/monthly?months` · `/reports/categories?from&to&type` | relatórios |
| `GET /reports/cycle?month` · `GET/PATCH /settings` | balanço do "meu mês" e dia de virada (`cycleEndDay`) |
| `GET /export/lancamentos.csv` · `/export/parcelas.csv` · `/export/acertos.csv` | exportação (`;`, vírgula decimal, UTF-8 com BOM) |
# spent-money
