# MedFlow

Plataforma de integração de dados clínicos para a rede pública de saúde.

## Portais

| Portal | Arquivo | Público |
|--------|---------|---------|
| Homepage | `medflow.html` | Todos |
| Cadastro (paciente) | `cadastro.html` | Paciente |
| Login (paciente) | `login.html` | Paciente |
| Login (profissional) | `login-profissional.html` | Profissional |
| Dashboard (paciente) | `dashboard.html` | Paciente |

## Fluxo de navegação

```
medflow.html
  ├── cadastro.html → dashboard.html
  ├── login.html → dashboard.html
  └── login-profissional.html → dashboard-profissional.html (a fazer)
```

## API (Back-end TypeScript + MySQL)

### Rotas públicas

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /health | Status da API |
| POST | /auth/register | Cadastro do paciente |
| POST | /auth/login | Login do paciente |
| POST | /auth/profissional/login | Login do profissional |
| POST | /auth/profissional/register | Cadastro do profissional |

### Rotas autenticadas — Paciente

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /usuarios/me | Perfil |
| GET | /consultas | Listar consultas |
| GET | /consultas/:id | Detalhe da consulta |
| POST | /consultas | Agendar consulta |
| PATCH | /consultas/:id/cancelar | Cancelar consulta |
| GET | /exames | Listar exames |
| GET | /exames/:id | Detalhe do exame |
| POST | /exames | Agendar exame |

### Rotas autenticadas — Profissional

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /prontuarios/paciente/:id | Prontuários do paciente |
| GET | /prontuarios/paciente/:id/historico | Histórico clínico completo |
| POST | /prontuarios | Criar prontuário |

## Como rodar

```bash
# 1. Criar banco MySQL
CREATE DATABASE medflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 2. Configurar variáveis
cp .env.example .env

# 3. Instalar dependências
npm install

# 4. Criar tabelas
npm run db:migrate

# 5. Subir API
npm run dev
```

## Tabelas

- `usuarios` — pacientes do SUS
- `profissionais` — médicos e profissionais da rede
- `unidades_saude` — UBS, UPA, hospitais
- `consultas` — agendamentos vinculados a paciente + profissional + unidade
- `exames` — exames vinculados a paciente + unidade
- `prontuarios` — registros clínicos criados por profissionais
