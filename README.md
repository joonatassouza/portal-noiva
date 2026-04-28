# Portal Noiva

Catálogo global e agenda de cultos/eventos das igrejas da Mensagem (Abertura da Palavra). Sem fins lucrativos. Sem anúncios. Sem taxas.

> Veja `CLAUDE.md` para o documento de produto/arquitetura completo.

## Stack do MVP local

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS com tokens centralizados em `src/presentation/styles/tokens.css`
- MongoDB local (porta 27017, sem auth) — driver oficial `mongodb`
- next-intl (PT-BR, ES-LA)
- Arquitetura hexagonal — domínio agnóstico ao banco; troca de adapter em `src/infrastructure/di/container.ts`

## Pré-requisitos

- Node.js 20+
- pnpm 9+ (`npm i -g pnpm` ou via [Corepack](https://pnpm.io/installation#using-corepack): `corepack enable`)
- MongoDB rodando localmente em `mongodb://127.0.0.1:27017` sem autenticação
  - macOS: `brew services start mongodb-community`
  - Linux/Windows: rode o `mongod` padrão ou `docker run -d -p 27017:27017 mongo:7`

## Subir o projeto

```bash
# 1. Instalar dependências
pnpm install

# 2. Variáveis de ambiente
cp .env.example .env.local       # já vem apontando para mongo local

# 3. Popular o banco com fixtures
pnpm seed

# 4. Subir o dev server
pnpm dev
```

Abrir http://localhost:3000 (redireciona para `/pt-BR`).

Páginas para testar:
- `/pt-BR` — home com lista de igrejas
- `/pt-BR/igreja/tabernaculo-da-fe-curitiba-curitiba` — página de uma igreja
- `/es-LA` — versão em espanhol

## Comandos

| Comando | Descrição |
|---|---|
| `pnpm dev` | Dev server com HMR |
| `pnpm build` | Build de produção |
| `pnpm start` | Servir build |
| `pnpm lint` | ESLint (regras de fronteira hexagonal incluídas) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest |
| `pnpm seed` | Popular o Mongo local com fixtures |
| `pnpm seed:reset` | Limpar coleções e popular do zero |

## Auth (Google OAuth)

O login social usa Auth.js v5 + Google.

1. Acesse [Google Cloud Console](https://console.cloud.google.com).
2. Crie um projeto (ex.: `portal-noiva-dev`) e configure a tela de consentimento OAuth como "External" em modo "Testing".
3. Em **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - **Application type**: Web application
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
4. Copie o Client ID + Client Secret.
5. Gere um segredo: `openssl rand -base64 32`.
6. Preencha no `.env.local`:

```env
AUTH_SECRET=<resultado_do_openssl>
AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
```

Em produção, repita os passos 3 e 6 com a URL do site de produção.

## Estrutura

```
src/
├── domain/           # Regras puras. Zero dependência externa.
├── application/      # Casos de uso + ports (interfaces de repos)
├── infrastructure/   # Adapters (mongo/, system/, di/)
├── presentation/     # Componentes, i18n, estilos, tokens
├── app/              # Next.js App Router (páginas)
└── shared/           # Utils puros
```

ESLint impede que `domain/` ou `application/` importem de `infrastructure/` ou `presentation/`.

## Trocar de banco

Editar `.env.local`:

```env
DB_DRIVER=mongo            # ou 'supabase' (a implementar na fase de produção)
```

Para um novo driver, criar `src/infrastructure/<driver>/` implementando `ChurchRepository` e `ServiceRepository`, e adicionar o caso no `switch` de `container.ts`. Nenhum outro arquivo precisa mudar.

## Rebrand pós-MVP

Toda a identidade visual (cores, fontes, raios) está em **um único arquivo**:

```
src/presentation/styles/tokens.css
```

A consultoria de design só precisa editar esse arquivo. Tailwind e componentes consomem via CSS variables — atualização instantânea, sem refatoração.

A logo é um componente SVG em `src/presentation/components/Logo.tsx` que também usa as mesmas variáveis de cor.

## Deploy de produção (Vercel + Mongo Atlas)

### 1. Mongo Atlas (free tier M0)

1. Crie um cluster M0 em [cloud.mongodb.com](https://cloud.mongodb.com).
2. **Database access** → crie um usuário com role `readWrite` no banco `portal_noiva`. Anote a senha (gere forte, sem caracteres URL-sensíveis ou faça URL-encode).
3. **Network access** → adicione `0.0.0.0/0` (Vercel é serverless e os IPs variam).
4. **Connect → Drivers → Node.js**, copie a string SRV. Substitua `<password>` pela senha do passo 2 e adicione o nome do banco antes do `?`:
   ```
   mongodb+srv://<user>:<senha>@cluster0.xxxxx.mongodb.net/portal_noiva?retryWrites=true&w=majority
   ```

### 2. Vercel

1. **Import** o repo Git no painel da Vercel.
2. **Build & Output Settings** → padrão (`pnpm build`, `next start`). Não precisa mexer.
3. **Environment Variables** (todas em `Production` e `Preview`):
   ```
   DB_DRIVER=mongo
   MONGO_URL=<a string SRV do Atlas>
   MONGO_DB=portal_noiva
   AUTH_SECRET=<openssl rand -base64 32>
   AUTH_URL=https://seudominio.org
   GOOGLE_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...
   NEXT_PUBLIC_SITE_URL=https://seudominio.org
   DEFAULT_LOCALE=pt-BR
   NOMINATIM_USER_AGENT=portal-noiva/1.0 (contato@seudominio.org)
   MASTER_ADMIN_EMAILS=seu@email.com
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=...
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   S3_PUBLIC_BASE_URL=https://....s3.us-east-1.amazonaws.com
   ```
4. **Domains** → conecte `seudominio.org` (Vercel cuida do TLS).

### 3. Google OAuth de produção

No mesmo OAuth Client de [Google Cloud Console](https://console.cloud.google.com), edite e adicione:

- **Authorized JavaScript origins**: `https://seudominio.org`
- **Authorized redirect URIs**: `https://seudominio.org/api/auth/callback/google`

(Mantenha as entradas de `localhost` para continuar usando dev.)

### 4. Primeiro deploy + indexes

Vercel faz o deploy automaticamente ao fazer push em `main`. Os índices do Mongo são criados automaticamente na primeira chamada que requer cada coleção (lazy via `ensureIndexes()` chamado pelo seed). Para popular dados de teste em produção:

```bash
# do seu próprio terminal, com .env.local apontando para o Atlas:
MONGO_URL='<atlas srv>' pnpm seed:reset
```

### 5. Master admin

O usuário cujo e-mail bater com `MASTER_ADMIN_EMAILS` ganha acesso a `/admin`. Faça login uma vez via OAuth para que o registro do usuário seja criado no Mongo, e o sininho passa a receber notificações de claims/proposals/denúncias.
