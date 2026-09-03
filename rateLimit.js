import rateLimit from 'express-rate-limit';

// Protege contra tentativas repetidas de adivinhar códigos de 4 dígitos
export const limitLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Demasiadas tentativas. Aguarda uns minutos antes de tentar novamente.' }
});

export const limitConsulta = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Demasiadas consultas seguidas. Aguarda um pouco.' }
});

export const limitRegisto = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Demasiados registos a partir daqui. Tenta mais tarde.' }
});
