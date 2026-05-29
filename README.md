# MedFlow

Plataforma de integração de dados clínicos para a rede pública de saúde (SUS). Permite que pacientes acompanhem consultas e exames e que profissionais de saúde gerenciem prontuários e agenda.

---

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — para rodar a API e o banco com um único comando
- [Node.js 20+](https://nodejs.org/) — para rodar o frontend localmente

---

## Rodando o projeto

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd MedFlow
```

### 2. Instale as dependências do frontend

```bash
npm install
```

### 3. Suba a API e o banco via Docker

```bash
docker-compose up --build
```

Aguarde a mensagem:

```
medflow_api  | MedFlow API rodando em http://localhost:3000
```

O banco PostgreSQL é criado e populado automaticamente na primeira execução.

### 4. Abra o frontend

Em outro terminal:

```bash
npm run front
```

O navegador abre automaticamente em `http://localhost:5500` com a landing page do MedFlow.

---

## Fluxo de navegação

```
medflow.html  (landing page)
  ├── cadastro.html          → dashboard-paciente.html
  ├── login.html             → dashboard-paciente.html
  └── login-profissional.html → dashboard-medico.html
```

---

## Cadastro de um profissional de saúde

A tela de cadastro de profissionais ainda não está no fluxo público. Use o endpoint diretamente:

```bash
curl -X POST http://localhost:3000/auth/profissional/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Dr. Carlos Mendes",
    "email": "carlos@medflow.com",
    "senha": "12345678",
    "crm": "12345-PE",
    "especialidade": "Cardiologia",
    "cargo": "Médico"
  }'
```

Depois acesse `login-profissional.html` → aba **Email Institucional**.

---

## Rotas da API

**Base URL:** `http://localhost:3000`

### Públicas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Status da API |
| POST | `/auth/register` | Cadastro de paciente |
| POST | `/auth/login` | Login de paciente |
| POST | `/auth/profissional/register` | Cadastro de profissional |
| POST | `/auth/profissional/login` | Login de profissional |

### Paciente (requer token)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/usuarios/me` | Perfil + contadores |
| GET | `/consultas` | Listar consultas |
| GET | `/consultas/:id` | Detalhe da consulta |
| POST | `/consultas` | Agendar consulta |
| PATCH | `/consultas/:id/cancelar` | Cancelar consulta |
| GET | `/exames` | Listar exames |
| GET | `/exames/:id` | Detalhe do exame |
| POST | `/exames` | Agendar exame |
| GET | `/prontuarios/paciente/:id` | Ver prontuários |

### Profissional (requer token)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/auth/profissional/me` | Perfil + estatísticas |
| GET | `/consultas/profissional` | Agenda completa |
| PATCH | `/consultas/:id/status` | Atualizar status da consulta |
| GET | `/prontuarios/buscar-paciente?cpf=` | Buscar paciente por CPF |
| GET | `/prontuarios/profissional/meus` | Prontuários criados por mim |
| GET | `/prontuarios/paciente/:id/historico` | Histórico clínico completo |
| POST | `/prontuarios` | Criar prontuário |

### Públicas — Listagens

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/unidades` | Listar unidades de saúde |
| GET | `/unidades/:id` | Detalhe da unidade |
| GET | `/profissionais?especialidade=` | Listar profissionais por especialidade |

---

## Autenticação

O projeto usa autenticação simples por ID (MVP). Após o login, o servidor retorna o campo `token` que é o UUID do usuário. Ele deve ser enviado em todas as requisições autenticadas:

```
Authorization: Bearer <token>
```

O frontend salva o token automaticamente no `localStorage`.

---

## Banco de dados

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Pacientes cadastrados |
| `profissionais` | Médicos e profissionais da rede |
| `unidades_saude` | UBS, UPA, hospitais, AME, CAPS |
| `consultas` | Agendamentos (paciente + profissional + unidade) |
| `exames` | Exames laboratoriais e de imagem |
| `prontuarios` | Registros clínicos criados por profissionais |

---

## Estrutura do projeto

```
MedFlow/
├── frontend/                  # Telas HTML (abrir com npm run front)
│   ├── medflow.html           # Landing page
│   ├── cadastro.html          # Cadastro de paciente
│   ├── login.html             # Login de paciente
│   ├── login-profissional.html
│   ├── dashboard-paciente.html
│   ├── dashboard-medico.html
│   ├── agendar-consulta.html
│   └── styles.css
├── src/                       # API Node.js + TypeScript
│   ├── app.ts
│   ├── server.ts
│   ├── controllers/
│   ├── db/                    # Pool e migration PostgreSQL
│   ├── middlewares/
│   ├── routes/
│   ├── services/
│   └── utils/
├── docker-compose.yml         # PostgreSQL + API
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## Scripts disponíveis

| Comando | O que faz |
|---------|-----------|
| `docker-compose up --build` | Sobe API + banco (primeira vez ou após mudanças no código) |
| `docker-compose up` | Sobe API + banco (sem rebuild) |
| `npm run front` | Serve o frontend em `localhost:5500` e abre o navegador |
| `npm run dev` | Sobe apenas a API localmente (sem Docker) |
| `npm run db:migrate` | Cria tabelas e popula unidades de saúde |
| `npm run build` | Compila TypeScript para `dist/` |

---

## Variáveis de ambiente

Copie `.env.example` para `.env` e ajuste se necessário:

```env
DATABASE_URL=postgres://medflow:medflow123@localhost:5432/medflow
PORT=3000
NODE_ENV=development
FRONTEND_URL=*
```

Com Docker, as variáveis já estão configuradas no `docker-compose.yml` e não é necessário criar o `.env`.
