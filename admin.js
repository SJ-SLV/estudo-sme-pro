import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { gerarCodigo, hash, verificar } from '../utils/crypto.js';
import { exigirAdmin } from '../middleware/auth.js';
import { limitLogin } from '../middleware/rateLimit.js';

const router = Router();

router.post('/admin/login', limitLogin, async (req, res) => {
  const nome = (req.body.nome || '').trim();
  const codigo = (req.body.codigo || '').trim();
  if (!nome || !codigo) return res.status(400).json({ erro: 'Preenche nome e código.' });

  const { rows } = await pool.query('select * from administradores where nome = $1', [nome]);
  const admin = rows[0];
  if (!admin || !(await verificar(codigo, admin.codigo_hash))) {
    return res.status(401).json({ erro: 'Credenciais de administrador incorretas.' });
  }
  const token = jwt.sign(
    { tipo: 'admin', nome: admin.nome, id: admin.id },
    process.env.JWT_SECRET,
    { expiresIn: '4h' }
  );
  res.json({ token, nome: admin.nome });
});

router.get('/admin/resumo', exigirAdmin, async (req, res) => {
  const { rows } = await pool.query(`
    select
      count(*)::int as total,
      count(*) filter (where status = 'pendente')::int as pendentes,
      count(*) filter (where status = 'aprovado' and not visto)::int as por_abrir,
      count(*) filter (where status = 'aprovado' and visto)::int as vistos
    from candidatos
  `);
  res.json(rows[0]);
});

router.get('/admin/candidatos', exigirAdmin, async (req, res) => {
  const status = req.query.status;
  const params = [];
  let sql = 'select nome, referencia, status, visto, criado_em, aprovado_em from candidatos';
  if (status) {
    sql += ' where status = $1';
    params.push(status);
  }
  sql += ' order by criado_em desc limit 200';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

// Aprovar: gera o código, guarda só o hash, e devolve o código em claro UMA VEZ,
// só nesta resposta ao admin — para ele enviar manualmente pelo WhatsApp do candidato.
router.post('/admin/candidatos/:referencia/aprovar', exigirAdmin, async (req, res) => {
  const referencia = req.params.referencia.toUpperCase();
  const { rows } = await pool.query('select id, nome from candidatos where upper(referencia) = $1', [referencia]);
  const rec = rows[0];
  if (!rec) return res.status(404).json({ erro: 'Candidato não encontrado.' });

  const codigo = gerarCodigo();
  const codigoHash = await hash(codigo);
  await pool.query(
    `update candidatos set status = 'aprovado', codigo_hash = $1, visto = false, aprovado_em = now() where id = $2`,
    [codigoHash, rec.id]
  );

  res.json({
    referencia,
    nome: rec.nome,
    codigo,
    aviso: 'Envia este código ao candidato pelo WhatsApp — ele não fica guardado em texto simples e não pode ser recuperado depois.'
  });
});

router.post('/admin/candidatos/:referencia/recusar', exigirAdmin, async (req, res) => {
  const referencia = req.params.referencia.toUpperCase();
  const { rowCount } = await pool.query(
    `update candidatos set status = 'recusado' where upper(referencia) = $1`,
    [referencia]
  );
  if (!rowCount) return res.status(404).json({ erro: 'Candidato não encontrado.' });
  res.json({ ok: true });
});

router.post('/admin/aviso', exigirAdmin, async (req, res) => {
  const texto = (req.body.texto || '').trim().slice(0, 500);
  await pool.query('update avisos set texto = $1, publicado_em = now() where id = 1', [texto]);
  res.json({ ok: true });
});

export default router;
