import jwt from 'jsonwebtoken';

export function exigirAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Sessão de administrador necessária.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.tipo !== 'admin') throw new Error('tipo de sessão inválido');
    req.admin = payload;
    next();
  } catch (e) {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada — inicia sessão novamente.' });
  }
}
