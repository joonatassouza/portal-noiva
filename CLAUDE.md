# Portal Noiva

> Catálogo global e agenda de cultos/eventos das igrejas da Mensagem (Abertura da Palavra). Sem fins lucrativos, sem anúncios, sem taxas, sem algoritmo.

---

## 1. Visão geral

Plataforma web pública (responsiva, mobile-first) que centraliza:

- Catálogo de igrejas/tabernáculos com endereço físico e digital (YouTube, Instagram, site).
- Agenda semanal de cultos recorrentes.
- Eventos especiais (Páscoa, conferências, retiros, Santa Ceia).
- Feed de mídia por igreja (álbuns, fotos) ligado a eventos/cultos — postado pela equipe de mídia da igreja.
- Mapa global com filtros por proximidade, dia da semana, transmissão ao vivo.
- Favoritar igrejas → dashboard pessoal com próximos cultos.
- QR Code PIX exibido na página da igreja (apenas informativo; nenhuma transação acontece no sistema).

**Não é uma rede social.** Não há feed algorítmico, likes, follows, mensagens privadas, compartilhamento dentro da plataforma. Apenas informação organizada e comentários simples em posts de mídia.

**Público-alvo:** crentes da Mensagem, ramo Abertura da Palavra. Foco geográfico: Brasil, Paraguai, Argentina, Chile, México, e diáspora global.

**Modelo:** sem fins lucrativos. Custo de operação ≈ R$ 0 (apenas domínio anual).

---

## 2. Princípios não-negociáveis

1. **Custo zero de infra.** Tudo em free tier. Único gasto previsto: domínio + bucket S3 (pago pelo dono do projeto).
2. **Database-agnostic.** O domínio nunca importa SDK do Supabase. Trocar de Postgres para Mongo deve ser uma troca de adapter.
3. **In-app only.** Sem e-mail transacional, sem SMS, sem Telegram, sem push web nesta versão. Notificações vivem em uma tabela `notifications` e são lidas via polling/realtime quando o usuário abre o app.
4. **Sem algoritmo.** Feeds são cronológicos. Listas são ordenadas por proximidade geográfica ou data, nunca por engajamento.
5. **Sem monetização embutida.** QR Code PIX é uma imagem estática que a igreja sobe; o sistema não vê valores nem rastreia doações.
6. **Mobile-first.** A maioria dos acessos será via celular em trânsito.
7. **SEO técnico desde o dia 1.** SSR/SSG + JSON-LD (`Church`, `Event`, `LocalBusiness`).
8. **i18n desde o dia 1.** PT-BR e ES-LA. Sem strings hardcoded em componentes.
9. **Soberania local.** A plataforma é facilitadora, nunca autoridade. Cada igreja administra a si mesma.

---

## 3. Stack técnica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | **Next.js 15** (App Router, React Server Components) | SSR/SSG para SEO, free na Vercel |
| Estilo | **Tailwind CSS** + design tokens | Minimalista, sem libs pesadas |
| i18n | **next-intl** | Roteamento por locale, RSC-friendly |
| Mapa | **Leaflet.js** + tiles **OpenStreetMap** | Zero custo, sem API key |
| Geocoding | **Nominatim** (OSM), apenas no backend, ≤ 1 req/s | Zero custo |
| Banco (default) | **Supabase Postgres** + **PostGIS** para raio | Free tier + RLS forte |
| Auth (default) | **Supabase Auth** (email + Google + Facebook OAuth) | Free, JWT, RLS-aware |
| Storage de mídia | **AWS S3** (bucket próprio) | Cota e custo controlados pelo dono; não consome free tier do Supabase |
| Hosting | **Vercel** (free) | Deploy contínuo + Edge Functions |
| Keep-alive | **GitHub Actions** cron 2x/semana | Evita pause do Supabase free |
| Validação | **Zod** | Schemas no domain layer |
| ORM/Query (default) | **Drizzle ORM** | Tipado, leve, fácil de trocar — usado **dentro** do adapter Postgres, nunca exposto ao domínio |

> ⚠️ **Tudo isso é o stack default.** O domínio não conhece nada disso. Ver seção 4.

---

## 4. Arquitetura (Hexagonal / Ports & Adapters)

Objetivo: poder trocar Supabase por MongoDB, Postgres self-hosted, Firebase ou qualquer outro **sem tocar no domínio**.

```
src/
├── domain/                    # Regras de negócio puras. Zero dependência externa.
│   ├── entities/              # Church, User, Event, Service, Volunteer, MediaPost...
│   ├── value-objects/         # Slug, Coordinates, PixKey, Locale...
│   ├── errors/                # DomainError, NotFoundError, UnauthorizedError...
│   └── policies/              # ownershipPolicy, mediaPostPolicy, ...
│
├── application/               # Casos de uso. Orquestra repositórios e policies.
│   ├── ports/                 # INTERFACES (contratos) que o domínio exige
│   │   ├── ChurchRepository.ts
│   │   ├── EventRepository.ts
│   │   ├── UserRepository.ts
│   │   ├── MediaStorage.ts
│   │   ├── Geocoder.ts
│   │   ├── NotificationStore.ts
│   │   └── Clock.ts
│   └── use-cases/
│       ├── ClaimChurchOwnership.ts
│       ├── CreateEvent.ts
│       ├── ApplyAsVolunteer.ts
│       ├── PostMediaToEvent.ts
│       ├── ListNearbyServices.ts
│       └── ...
│
├── infrastructure/            # IMPLEMENTAÇÕES concretas dos ports
│   ├── supabase/
│   │   ├── SupabaseChurchRepository.ts
│   │   ├── SupabaseEventRepository.ts
│   │   └── ...
│   ├── mongodb/               # (futuro) — basta implementar os mesmos ports
│   ├── s3/
│   │   └── S3MediaStorage.ts
│   ├── nominatim/
│   │   └── NominatimGeocoder.ts
│   └── di/                    # Container de injeção (escolhe qual adapter usar)
│       └── container.ts
│
├── presentation/              # Next.js: pages, API routes, components
│   ├── app/                   # App Router
│   ├── components/
│   └── lib/                   # helpers de UI, hooks
│
└── shared/                    # Utils puros (formatadores, etc.)
```

**Regra de ouro:** `domain/` e `application/` **não importam** nada de `infrastructure/`, `presentation/`, Supabase, S3 ou Next.js. Eles só conhecem as interfaces dos ports.

A escolha do adapter acontece em **um único lugar**: `infrastructure/di/container.ts`, lido por variável de ambiente (`DB_DRIVER=supabase|mongo|postgres`).

### Exemplo concreto

```ts
// application/ports/ChurchRepository.ts  (CONTRATO)
export interface ChurchRepository {
  findBySlug(slug: string): Promise<Church | null>;
  findNearby(coords: Coordinates, radiusKm: number): Promise<Church[]>;
  save(church: Church): Promise<void>;
}

// application/use-cases/ListNearbyServices.ts  (USO — não sabe nada de SQL)
export class ListNearbyServices {
  constructor(
    private churches: ChurchRepository,
    private clock: Clock,
  ) {}
  async execute(coords: Coordinates, radiusKm: number) { /* ... */ }
}

// infrastructure/supabase/SupabaseChurchRepository.ts  (IMPLEMENTAÇÃO)
export class SupabaseChurchRepository implements ChurchRepository { /* ... */ }
```

Trocar de banco = escrever um novo arquivo `MongoChurchRepository.ts` que implementa a mesma interface. Zero alteração em domínio ou casos de uso.

---

## 5. Modelagem de domínio (entidades)

Mantemos a modelagem do levantamento original, com ajustes:

- **User / Profile** — id, fullName, avatarUrl, locale.
- **Church** — id, slug, name, description, physicalAddress, coords (lat/lng), youtubeUrl, instagramUrl, facebookUrl, websiteUrl, pixKey (string informativa), pixQrcodeImageUrl (S3), ownershipStatus (`UNCLAIMED` | `CLAIMED` | `PENDING_REVIEW`), country, city.
- **ChurchRole** — churchId, userId, roleType (`OWNER` | `EDITOR_ADMIN` | `MEDIA_EDITOR`).
  - `OWNER`: tudo, inclui gerir PIX, convidar editores, transferir ownership.
  - `EDITOR_ADMIN`: edita info da igreja, cultos, eventos. Não toca em PIX nem em roles.
  - `MEDIA_EDITOR`: **só** cria/edita posts de mídia ligados a eventos.
- **Service** — id, churchId, dayOfWeek (0–6), startTime, endTime, label, hasLiveStream (bool).
- **Event** — id, churchId, title, description, startDatetime, endDatetime, eventLocation (texto livre, pode ser fora da igreja), acceptingVolunteers (bool).
- **VolunteerApplication** — id, eventId, applicantUserId, offeredRole (texto), coverMessage (texto), statusStage (`SUBMITTED` | `CONTACTED` | `ACCEPTED` | `REJECTED`).
- **MediaPost** — id, eventId (obrigatório — todo post pertence a um evento ou culto), churchId (denormalizado p/ feed da igreja), authorUserId, type (`ALBUM_LINK` | `IMAGE_GALLERY`), externalUrl (Facebook/Flickr/Instagram, opcional), images[] (URLs do S3), caption, createdAt.
- **MediaComment** — id, mediaPostId, authorUserId, body, createdAt. **Sem replies. Sem likes.**
- **Favorite** — userId, churchId, createdAt.
- **Notification** — id, recipientUserId, type, payload (jsonb), readAt, createdAt. **In-app only.**
- **OwnershipClaim** — id, churchId, claimantUserId, evidence (texto/links), status (`PENDING` | `APPROVED` | `REJECTED`), reviewedBy, reviewedAt.

Identificadores: UUID v7 (ordenáveis por tempo).

---

## 6. Permissões resumidas

| Ação | Visitante | Usuário | Media Editor | Editor Admin | Owner | Master Admin |
|---|---|---|---|---|---|---|
| Ver catálogo / mapa / agendas | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Favoritar igreja | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Solicitar voluntariado | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Comentar em post de mídia | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Postar mídia ligada a evento da igreja X | ❌ | ❌ | ✅ (só X) | ✅ (só X) | ✅ (só X) | ✅ |
| Editar info/cultos/eventos da igreja X | ❌ | ❌ | ❌ | ✅ (só X) | ✅ (só X) | ✅ |
| Editar PIX / convidar roles na igreja X | ❌ | ❌ | ❌ | ❌ | ✅ (só X) | ✅ |
| Aprovar claim de ownership | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Cadastrar/seedar igrejas | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

Implementação: **Row Level Security (RLS)** no Postgres + checagens nos use-cases. Defesa em profundidade.

---

## 7. Funcionalidades de mídia

- Posts pertencem a uma `Church`. **Vínculo com `Event` é opcional** — pode-se publicar mídia geral da igreja ou amarrar a um culto/evento específico.
- Tipos de post:
  - `ALBUM_LINK`: o post é só um link externo (Facebook album, Flickr, Instagram post). Renderiza thumbnail + título + redirecionamento.
  - `IMAGE_GALLERY`: imagens hospedadas no S3 do dono do projeto. Comprimidas client-side em WebP antes do upload (≤ 200KB por imagem). Limite por post: 20 imagens.
- Comentários: texto puro, ≤ 500 caracteres, sem replies, sem likes, sem mentions.
- **Quem pode excluir comentário:** autor do comentário, autor do post, OWNER ou EDITOR_ADMIN da igreja, master admin.
- Compartilhar: botão usa Web Share API onde disponível, copia link em fallback (`/igreja/{slug}/post/{postId}`).
- Denunciar: qualquer usuário logado denuncia um post. Gera notificação `MEDIA_POST_REPORT` em destaque vermelho para o master admin com motivo opcional.
- Feed da igreja: `/igreja/{slug}` exibe os posts em ordem cronológica decrescente.
- **Feed global cronológico** existe na home, em uma aba ao lado de "Próximos cultos" e "Próximos eventos", com infinite scroll. Cada card tem 3 ações: comentar (vai para a página do post), compartilhar, denunciar. **Sem algoritmo, sem ranking, sem likes.**

---

## 8. Notificações (in-app)

Tabela `notifications` simples. Tipos previstos no MVP:

- `OWNERSHIP_CLAIM_SUBMITTED` (para o Master Admin)
- `OWNERSHIP_CLAIM_APPROVED` / `REJECTED` (para o claimant)
- `VOLUNTEER_APPLICATION_NEW` (para owners/editors da igreja do evento)
- `ROLE_INVITATION` (quando owner adiciona alguém)
- `MEDIA_COMMENT_NEW` (para o autor do post de mídia)

Entrega: **realtime do Supabase** quando o usuário está online; senão polling a cada abertura do app. Badge no sininho. Sem push, sem e-mail.

---

## 9. SEO técnico

- SSG para páginas de igreja e evento; ISR (revalidate 1h) para listagens.
- `<head>` com Open Graph + Twitter Card por página.
- JSON-LD `Church` (com `geo`, `openingHoursSpecification` derivada de `Service`) em cada página de igreja.
- JSON-LD `Event` em cada página de evento (habilita rich snippets).
- `sitemap.xml` gerado dinamicamente via route handler.
- `robots.txt` permissivo.
- URLs canônicas com slug: `/igreja/tabernaculo-da-fe-curitiba`, `/eventos/{eventSlug}`.

---

## 10. Internacionalização

- Locales suportados no MVP: `pt-BR`, `es-LA`. Inglês em fase 2.
- Strings em `messages/{locale}.json`.
- Conteúdo gerado por usuário **não é traduzido automaticamente** — preserva a voz original da igreja.
- URL com prefixo de locale: `/pt-BR/...`, `/es-LA/...`. Default = locale do browser.

---

## 11. Geoespacial

- Coordenadas armazenadas como `lat` / `lng` (float8) **e** `geom` (PostGIS `POINT`).
- Geocoding via Nominatim **só** acontece no backend, no momento de criar/editar igreja. Resultado é persistido. Cliente nunca chama Nominatim.
- Busca por raio: stored procedure `nearby_services(lat, lng, radius_km, within_hours)` usando `ST_DWithin` + Haversine.
- Para o adapter Mongo (futuro): índice 2dsphere + `$near`.

---

## 12. Convenções

- TypeScript strict.
- Nomes de arquivos: `PascalCase` para classes/entidades, `kebab-case` para rotas, `camelCase` para utilitários.
- Imports absolutos via `@/domain`, `@/application`, etc.
- Testes: Vitest. Domínio e use-cases têm cobertura. Adapters têm testes de integração contra um Postgres local em Docker.
- Commits: Conventional Commits.
- Branch principal: `main`. PRs obrigatórios.
- Lint: ESLint + regra que **proíbe** import de `infrastructure/*` ou `next/*` dentro de `domain/` e `application/`.
- Gerenciador de pacotes: **pnpm** (ver `packageManager` em `package.json`).

### 12.1 Política de componentes (REUSO PRIMEIRO)

Antes de criar **qualquer** componente novo, o agente **deve**:

1. **Procurar primeiro.** Listar `src/presentation/components/ui/` (primitivos) e
   `src/presentation/components/` (composições) e ler os componentes cujo nome,
   propósito ou shape pareçam encaixar.
2. **Reutilizar.** Se existir algo equivalente, usar como está. Se faltar uma
   prop, **estender o existente** com prop opcional (com default que preserva o
   comportamento atual) em vez de duplicar.
3. **Generalizar antes de duplicar.** Se duas telas precisam de variações de um
   bloco (ex.: hero, card, lista vazia), promover para `components/ui/` antes de
   criar uma segunda versão local.
4. **Criar novo apenas quando** nenhum primitivo cobre o caso e o componente
   é genuinamente reutilizável (ou claramente único — uma página inteira).

**Camadas de componentes:**

| Camada | Pasta | Pode importar | Exemplos |
|---|---|---|---|
| Primitivos (UI agnóstica) | `src/presentation/components/ui/` | Apenas tokens via Tailwind, `react`, outros primitivos | `Container`, `PageHero`, `SectionHeading`, `Card`, `Button`, `Badge`, `Input`, `SearchInput`, `EmptyState`, `ExternalLink` |
| Composições de domínio | `src/presentation/components/` | Primitivos + entidades de domínio | `ChurchCard`, `ChurchFilters`, `ChurchMap`, `ServiceList`, `Header`, `Footer`, `Logo` |
| Páginas | `src/app/**` | Tudo acima | `app/[locale]/page.tsx`, `app/[locale]/igrejas/page.tsx` |

**Regras adicionais:**

- Nada de cores hardcoded em componentes — só tokens Tailwind (`text-ink`, `bg-surface`, …) que vêm de `src/presentation/styles/tokens.css`.
- Strings de UI vão para `messages/{locale}.json`; componentes recebem `useTranslations` ou via prop. Nada hardcoded em PT/ES.
- Mobile-first: o estilo base é o do mobile; usar `xs:` / `sm:` / `lg:` para enriquecer.
- Componentes **não** importam `infrastructure/*`. Quem busca dados é a página (server component) e passa como prop.
- Cada componente exporta **um** componente nomeado (sem default export para
  primitivos), facilita refatoração e busca por nome.

---

## 13. Roadmap por fases

**Fase 0 — Fundação (semana 1)**
- Setup Next.js + Tailwind + ESLint + Vitest.
- Estrutura de pastas hexagonal + container DI.
- Supabase project + schema inicial via migrations Drizzle.
- Bucket S3 + IAM mínimo.
- CI no GitHub Actions: lint + test + keep-alive cron.

**Fase 1 — Catálogo público (semanas 2–3)**
- Entidades `Church`, `Service`. Repos Supabase.
- Páginas: home, lista, página da igreja, mapa global.
- i18n PT/ES. SEO básico + JSON-LD `Church`.
- Seed de 30 igrejas notórias (status `UNCLAIMED`).

**Fase 2 — Auth + Favoritos (semana 4)**
- Login social (Google) + e-mail.
- Favoritar igreja, dashboard `/meu-painel` com próximos cultos das favoritas.
- Filtro "transmissão hoje".

**Fase 3 — Ownership + Painel da Igreja (semanas 5–6)**
- Fluxo de claim (formulário + provas).
- Master Admin panel.
- Painel do owner: editar info, cultos, eventos. Convidar Editor/Media editor.
- RLS completo.

**Fase 4 — Eventos + Voluntariado + Notificações (semana 7)**
- CRUD de eventos especiais. JSON-LD `Event`.
- Inscrição de voluntário.
- Tabela `notifications` + sininho com realtime.

**Fase 5 — Mídia (semanas 8–9)**
- Role `MEDIA_EDITOR`.
- Upload p/ S3 com compressão WebP no client.
- Posts ligados a eventos. Comentários simples. Share por link.
- Feed cronológico na página da igreja.

**Fase 6 — Polimento + lançamento (semana 10)**
- Acessibilidade (WCAG AA), Lighthouse ≥ 95.
- Sitemap, robots, OG images dinâmicas.
- Documentação para colaboradores.
- Lançamento piloto.

---

## 14. Variáveis de ambiente

```
# Driver
DB_DRIVER=supabase

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# S3
AWS_REGION=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=

# Geocoding
NOMINATIM_USER_AGENT=portal-noiva/1.0 (contato@dominio.org)

# Master Admin
MASTER_ADMIN_EMAILS=appdev@vengreso.com
```

---

## 15. Open questions (decidir antes de codar)

1. Nome final do projeto (ver seção 16).
2. Domínio: `.org`, `.com`, `.app`?
3. Logo definitiva.
4. Política de moderação de comentários (auto-flag por palavras-chave? aprovação manual?).
5. Política de privacidade e LGPD (mínima, mas necessária por causa de e-mails e auth).

---

## 16. Sugestões de nome

Começando com **"Portal Noiva"** como working title. Outras opções para considerar:

| Nome | Conceito | Notas |
|---|---|---|
| **Portal Noiva** | Direto. Identidade do grupo + função do site. | Working title. `portalnoiva.org` — checar disponibilidade. |
| **Luz do Entardecer** | Evening Light. Forte apelo escatológico. | Lindo, mas longo para domínio. |
| **Maranata** | Bíblico, universalmente reconhecido entre crentes. | Pode soar genérico. |
| **Portal Abertura** | Reverência direta à "Abertura da Palavra". | Muito específico, ótimo para o nicho. |
| **Tabernáculos** | Plural — sugere catálogo. | Curto, registrável. |
| **Guia Tabernáculo** | Função clara: guia + tabernáculo. | Funcional, talvez pouco poético. |
| **Voz da Noiva** | Apela ao aspecto comunitário. | Mais ligado a conteúdo do que a catálogo. |
| **Conexão Noiva** | Função social-light. | Okay. |
| **Ágape** | Amor cristão; curto; pronunciável em PT/ES. | Já bem usado em outros contextos. |
| **Eleitos** | Identidade teológica. | Pode soar exclusivista. |
| **Shekinah** | Glória/presença. | Hebraico — pode confundir leigos. |
| **Caminho Reto** | Apela à doutrina. | Genérico. |
| **Sete Selos** | Símbolo central da Mensagem. | Específico demais — pode ser meme-ável. |
| **Noiva** (só isso) | Minimalismo radical. `noiva.org` ou `noiva.app`. | Provavelmente indisponível. |

Recomendação: **Portal Noiva** se for óbvio para o público; **Portal Abertura** se quiser ressoar mais profundamente com a teologia específica do ramo.

---

## 17. O que NÃO fazer

- ❌ Não construir feed global, timeline, ou qualquer coisa que sugira "rede social".
- ❌ Não adicionar likes, reações, follows, DMs.
- ❌ Não cobrar nada, nunca. Não inserir anúncios.
- ❌ Não hospedar mídia no Supabase Storage (usar S3 do dono).
- ❌ Não chamar Nominatim ou qualquer API geo a partir do browser.
- ❌ Não importar SDK do Supabase fora de `infrastructure/supabase/`.
- ❌ Não tentar mediar/intermediar pagamentos PIX.
- ❌ Não tomar partido em disputas teológicas internas; a plataforma é catálogo, não autoridade.
