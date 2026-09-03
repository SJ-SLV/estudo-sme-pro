import bcrypt from 'bcryptjs';

// Carateres sem ambiguidade visual (sem 0/O, 1/I) para referências fáceis de ler e ditar
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function gerarReferencia() {
  let s = 'SME-';
  for (let i = 0; i < 6; i++) {
    s += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)];
  }
  return s;
}

export function gerarCodigo() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function hash(valor) {
  return bcrypt.hash(valor, 10);
}

export async function verificar(valor, hashGuardado) {
  if (!hashGuardado || !valor) return false;
  return bcrypt.compare(valor, hashGuardado);
}
