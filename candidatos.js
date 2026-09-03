import { Router } from 'express';
import { pool } from '../db.js';
import { gerarReferencia, verificar } from '../utils/crypto.js';
import { limitLogin, limitConsulta, limitRegisto } from '../middleware/rateLimit.js';

const router = Router();

// Criar conta — só pede o nome, a referência é gerada aqui
router.post('/candidatos', limitRegisto, async (req, res) => {
  const nome = (req.body.nome || '').trim();
  if (!nome || nome.length < 3) {
    return res.status(400).json({ erro: 'Indica o teu nome completo.' });
  }
  if (nome.length > 120) {
    return res.status(400).json({ erro: 'Nome demasiado longo.' });
  }

  let referencia;
  let tentativas = 0;
  do {
    referencia = gerarReferencia();
    tentativas++;
  } while (tentativas < 5 && (await referenciaExiste(referencia)));

  const { rows } = await pool.query(
    `insert into candidatos (nome, referencia) values ($1, $2) returning referencia, criado_em`,
    [nome, referencia]
  );
  res.status(201).json(rows[0]);
});

async function referenciaExiste(ref) {
  const { rows } = await pool.query('select 1 from candidatos where referencia = $1', [ref]);
  return rows.length > 0;
}

// Consultar estado por referência — devolve só o estado, nunca o código.
// O código de login é entregue ao candidato pela equipa via WhatsApp no momento da aprovação
// (o mesmo canal onde o candidato já enviou o comprovativo), nunca por este endpoint público.
router.get('/candidatos/:referencia', limitConsulta, async (req, res) => {
  const referencia = req.params.referencia.trim().toUpperCase();
  const { rows } = await pool.query(
    `select nome, referencia, status, visto from candidatos where upper(referencia) = $1`,
    [referencia]
  );
  const rec = rows[0];
  if (!rec) return res.status(404).json({ erro: 'Referência não encontrada.' });

  res.json({
    referencia: rec.referencia,
    status: rec.status
  });
});

// Login do candidato — nome + código (verificado contra o hash guardado)
router.post('/login', limitLogin, async (req, res) => {
  const nome = (req.body.nome || '').trim();
  const codigo = (req.body.codigo || '').trim();
  if (!nome || !codigo) return res.status(400).json({ erro: 'Preenche nome e código.' });

  const { rows } = await pool.query(
    `select id, nome, referencia, codigo_hash from candidatos where lower(nome) = lower($1) and status = 'aprovado'`,
    [nome]
  );
  const rec = rows[0];
  if (!rec || !(await verificar(codigo, rec.codigo_hash))) {
    return res.status(401).json({ erro: 'Nome ou código incorretos.' });
  }
  await pool.query('update candidatos set visto = true where id = $1', [rec.id]);
  res.json({ nome: rec.nome, referencia: rec.referencia });
});

// Aviso público — texto mostrado na barra rolante do painel dos candidatos
router.get('/aviso', async (req, res) => {
  const { rows } = await pool.query('select texto from avisos where id = 1');
  res.json({ texto: rows[0]?.texto || '' });
});

export default router;
