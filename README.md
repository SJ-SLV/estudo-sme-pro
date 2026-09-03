# Estudo SME Pro — API

Backend real da plataforma de candidatos: contas, aprovação manual de pagamento e painel de administrador.

## 1. Base de dados

Cria um projeto gratuito em [supabase.com](https://supabase.com) (ou usa qualquer Postgres). No SQL editor, corre o conteúdo de `schema.sql`.

## 2. Configuração

```bash
cp .env.example .env
```

Preenche:
- `DATABASE_URL` — connection string do Supabase (Project Settings → Database)
- `JWT_SECRET` — uma string longa e aleatória (ex: `openssl rand -hex 32`)
- `ADMIN_NAME` / `ADMIN_CODE` — as credenciais do primeiro administrador (troca o código `0707` de exemplo por um valor só teu antes de publicar)

## 3. Instalar e arrancar

```bash
npm install
npm run seed:admin   # cria o administrador definido no .env
npm start             # arranca a API em http://localhost:3000
```

## 4. Publicar (deploy)

- **API:** Render, Railway ou Fly.io — todos correm um `npm start` a partir deste repositório, basta configurar as mesmas variáveis de ambiente do `.env`.
- **Base de dados:** já fica no Supabase, não precisa de outro serviço.
- **Frontend:** publica o `plataforma.html` num serviço estático (Vercel, Netlify, Cloudflare Pages) e aponta a variável `API_BASE` no topo do ficheiro para o URL da tua API.

## Decisões de segurança importantes

- **O código de login nunca é guardado nem devolvido em texto simples**, exceto uma única vez, na resposta ao administrador quando aprova um candidato — para ele copiar e enviar pelo WhatsApp. Isto fecha uma falha do protótipo inicial, onde qualquer pessoa podia tentar adivinhar referências e ver códigos.
- **Limite de tentativas** (`express-rate-limit`) nos endpoints de login, consulta e registo, porque um código de 4 dígitos só tem 10 mil combinações possíveis.
- **Sessão do administrador via JWT** com validade de 4 horas, em vez de credenciais fixas visíveis no código do frontend.
- Todas as queries usam parâmetros (`$1, $2...`), nunca concatenação de texto — protege contra injeção de SQL.

## Endpoints

| Método | Rota | Acesso |
|---|---|---|
| POST | `/api/candidatos` | público — criar conta |
| GET | `/api/candidatos/:referencia` | público — ver estado |
| POST | `/api/login` | público — login do candidato |
| GET | `/api/aviso` | público — texto da barra rolante |
| POST | `/api/admin/login` | público — login do admin |
| GET | `/api/admin/resumo` | admin |
| GET | `/api/admin/candidatos?status=` | admin |
| POST | `/api/admin/candidatos/:referencia/aprovar` | admin |
| POST | `/api/admin/candidatos/:referencia/recusar` | admin |
| POST | `/api/admin/aviso` | admin |

## Próximo passo possível

Ligar `/api/admin/candidatos/:referencia/aprovar` a um envio automático de WhatsApp (Meta Cloud API) para eliminar o passo manual de copiar o código — ou trocar a confirmação manual do pagamento pela API do Multicaixa Express, quando fizer sentido para o volume de candidatos.
