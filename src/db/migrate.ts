import 'dotenv/config'
import pool from './pool'

async function migrate() {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')

    await client.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`)

    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        nome          VARCHAR(100) NOT NULL,
        sobrenome     VARCHAR(100) NOT NULL,
        cpf           CHAR(11)     NOT NULL,
        email         VARCHAR(255) NOT NULL,
        senha_hash    VARCHAR(255) NOT NULL,
        ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
        criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_usuario_cpf   UNIQUE (cpf),
        CONSTRAINT uq_usuario_email UNIQUE (email)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS profissionais (
        id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        nome          VARCHAR(200) NOT NULL,
        crm           VARCHAR(30),
        matricula     VARCHAR(50),
        email         VARCHAR(255) NOT NULL,
        senha_hash    VARCHAR(255) NOT NULL,
        especialidade VARCHAR(100),
        cargo         VARCHAR(100) NOT NULL DEFAULT 'Médico',
        ativo         BOOLEAN      NOT NULL DEFAULT TRUE,
        criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_prof_email UNIQUE (email),
        CONSTRAINT uq_prof_crm   UNIQUE (crm)
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS unidades_saude (
        id       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
        nome     VARCHAR(200) NOT NULL,
        endereco VARCHAR(300) NOT NULL,
        cidade   VARCHAR(100) NOT NULL,
        estado   CHAR(2)      NOT NULL,
        telefone VARCHAR(20),
        tipo     VARCHAR(20)  NOT NULL CHECK (tipo IN ('UBS','UPA','HOSPITAL','AME','CAPS')),
        ativo    BOOLEAN      NOT NULL DEFAULT TRUE
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS consultas (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id       UUID        NOT NULL REFERENCES usuarios(id),
        profissional_id  UUID        REFERENCES profissionais(id),
        unidade_id       UUID        NOT NULL REFERENCES unidades_saude(id),
        data_hora        TIMESTAMPTZ NOT NULL,
        status           VARCHAR(20) NOT NULL DEFAULT 'AGENDADA'
                           CHECK (status IN ('AGENDADA','CONFIRMADA','EM_ANDAMENTO','CONCLUIDA','CANCELADA','FALTA')),
        observacoes      TEXT,
        anotacoes_medico TEXT,
        criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS exames (
        id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id     UUID        NOT NULL REFERENCES usuarios(id),
        consulta_id    UUID        REFERENCES consultas(id),
        unidade_id     UUID        NOT NULL REFERENCES unidades_saude(id),
        tipo           VARCHAR(100) NOT NULL,
        data_agendada  TIMESTAMPTZ NOT NULL,
        data_resultado TIMESTAMPTZ,
        status         VARCHAR(20) NOT NULL DEFAULT 'AGENDADO'
                         CHECK (status IN ('AGENDADO','COLETADO','EM_ANALISE','PRONTO','CANCELADO')),
        resultado      TEXT,
        laudo          TEXT,
        criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    await client.query(`
      CREATE TABLE IF NOT EXISTS prontuarios (
        id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id       UUID        NOT NULL REFERENCES usuarios(id),
        profissional_id  UUID        NOT NULL REFERENCES profissionais(id),
        consulta_id      UUID        REFERENCES consultas(id),
        descricao        TEXT        NOT NULL,
        diagnostico      VARCHAR(500),
        cid10            VARCHAR(20),
        encaminhamento   TEXT,
        criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    /* Trigger para atualizar atualizado_em automaticamente */
    await client.query(`
      CREATE OR REPLACE FUNCTION set_atualizado_em()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.atualizado_em = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `)

    for (const tabela of ['usuarios', 'profissionais', 'consultas', 'exames']) {
      await client.query(`
        DROP TRIGGER IF EXISTS trg_${tabela}_atualizado_em ON ${tabela};
        CREATE TRIGGER trg_${tabela}_atualizado_em
          BEFORE UPDATE ON ${tabela}
          FOR EACH ROW EXECUTE FUNCTION set_atualizado_em()
      `)
    }

    /* Seed: unidades de saúde para demonstração */
    await client.query(`
      INSERT INTO unidades_saude (nome, endereco, cidade, estado, telefone, tipo)
      SELECT * FROM (VALUES
        ('UBS Boa Vista',              'Rua das Flores, 100',                       'Recife',        'PE', '(81) 3333-1111', 'UBS'),
        ('UPA 24h Afogados',           'Av. Caxangá, 3200',                         'Recife',        'PE', '(81) 3333-2222', 'UPA'),
        ('Hospital da Restauração',    'Av. Gov. Agamenon Magalhães, s/n',           'Recife',        'PE', '(81) 3333-3333', 'HOSPITAL'),
        ('UBS Vila Nova',              'Rua Principal, 45',                         'Olinda',        'PE', '(81) 3333-4444', 'UBS'),
        ('AME Recife',                 'Av. Agamenon Magalhães, 4760',               'Recife',        'PE', '(81) 3333-5555', 'AME'),
        ('CAPS Centro',                'Rua da Aurora, 200',                        'Recife',        'PE', '(81) 3333-6666', 'CAPS'),
        ('Hospital Universitário',     'Av. Prof. Moraes Rego, 1235',               'Recife',        'PE', '(81) 3333-7777', 'HOSPITAL')
      ) AS v(nome, endereco, cidade, estado, telefone, tipo)
      WHERE NOT EXISTS (SELECT 1 FROM unidades_saude LIMIT 1)
    `)

    await client.query('COMMIT')
    console.log('✅ Migração concluída com sucesso.')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Erro na migração:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
