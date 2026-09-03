// Cria (ou atualiza) o administrador inicial a partir de ADMIN_NAME / ADMIN_CODE no .env
// Uso: npm run seed:admin
import dotenv from 'dotenv';
dotenv.config();
import { pool } from './db.js';
import { hash } from './utils/crypto.js';

async function seed() {
  const nome = process.env.ADMIN_NAME;
  const codigo = process.env.ADMIN_CODE;
  if (!nome || !codigo) {
    console.error('Define ADMIN_NAME e ADMIN_CODE no .env antes de correr este script.');
    process.exit(1);
  }
  const codigoHash = await hash(codigo);
  await pool.query(
    `insert into administradores (nome, codigo_hash) values ($1, $2)
     on conflict (nome) do update set codigo_hash = excluded.codigo_hash`,
    [nome, codigoHash]
  );
  console.log(`Administrador "${nome}" criado/atualizado com sucesso.`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
