import 'dotenv/config'
import pool from './pool'

async function migrate() {
  const conn = await pool.getConnection()

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0')

    await conn.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id           CHAR(36)     NOT NULL DEFAULT (UUID()),
        nome         VARCHAR(100) NOT NULL,
        sobrenome    VARCHAR(100) NOT NULL,
        cpf          CHAR(11)     NOT NULL,
        email        VARCHAR(255) NOT NULL,
        senha_hash   VARCHAR(255) NOT NULL,
        ativo        TINYINT(1)   NOT NULL DEFAULT 1,
        criado_em    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_cpf (cpf),
        UNIQUE KEY uq_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await conn.query(`
      CREATE TABLE IF NOT EXISTS unidades_saude (
        id        CHAR(36)     NOT NULL DEFAULT (UUID()),
        nome      VARCHAR(200) NOT NULL,
        endereco  VARCHAR(300) NOT NULL,
        cidade    VARCHAR(100) NOT NULL,
        estado    CHAR(2)      NOT NULL,
        telefone  VARCHAR(20),
        tipo      ENUM('UBS','UPA','HOSPITAL','AME','CAPS') NOT NULL,
        ativo     TINYINT(1)   NOT NULL DEFAULT 1,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await conn.query(`
      CREATE TABLE IF NOT EXISTS medicos (
        id            CHAR(36)     NOT NULL DEFAULT (UUID()),
        nome          VARCHAR(200) NOT NULL,
        crm           VARCHAR(20)  NOT NULL,
        especialidade VARCHAR(100) NOT NULL,
        ativo         TINYINT(1)   NOT NULL DEFAULT 1,
        PRIMARY KEY (id),
        UNIQUE KEY uq_crm (crm)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await conn.query(`
      CREATE TABLE IF NOT EXISTS consultas (
        id            CHAR(36)  NOT NULL DEFAULT (UUID()),
        usuario_id    CHAR(36)  NOT NULL,
        medico_id     CHAR(36)  NOT NULL,
        unidade_id    CHAR(36)  NOT NULL,
        data_hora     DATETIME  NOT NULL,
        status        ENUM('AGENDADA','CONFIRMADA','EM_ANDAMENTO','CONCLUIDA','CANCELADA','FALTA') NOT NULL DEFAULT 'AGENDADA',
        observacoes   TEXT,
        criado_em     DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_consulta_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios (id),
        CONSTRAINT fk_consulta_medico   FOREIGN KEY (medico_id)   REFERENCES medicos (id),
        CONSTRAINT fk_consulta_unidade  FOREIGN KEY (unidade_id)  REFERENCES unidades_saude (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await conn.query(`
      CREATE TABLE IF NOT EXISTS exames (
        id             CHAR(36)  NOT NULL DEFAULT (UUID()),
        usuario_id     CHAR(36)  NOT NULL,
        consulta_id    CHAR(36),
        unidade_id     CHAR(36)  NOT NULL,
        tipo           VARCHAR(100) NOT NULL,
        data_agendada  DATETIME  NOT NULL,
        data_resultado DATETIME,
        status         ENUM('AGENDADO','COLETADO','EM_ANALISE','PRONTO','CANCELADO') NOT NULL DEFAULT 'AGENDADO',
        resultado      TEXT,
        laudo          TEXT,
        criado_em      DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
        atualizado_em  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_exame_usuario   FOREIGN KEY (usuario_id)  REFERENCES usuarios (id),
        CONSTRAINT fk_exame_consulta  FOREIGN KEY (consulta_id) REFERENCES consultas (id),
        CONSTRAINT fk_exame_unidade   FOREIGN KEY (unidade_id)  REFERENCES unidades_saude (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    await conn.query('SET FOREIGN_KEY_CHECKS = 1')

    console.log('✅ Tabelas criadas com sucesso.')
  } catch (err) {
    console.error('❌ Erro na migration:', err)
    process.exit(1)
  } finally {
    conn.release()
    await pool.end()
  }
}

migrate()
