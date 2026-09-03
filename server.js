import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import candidatosRouter from './routes/candidatos.js';
import adminRouter from './routes/admin.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json({ limit: '20kb' }));

app.use('/api', candidatosRouter);
app.use('/api', adminRouter);

app.get('/api/saude', (req, res) => res.json({ ok: true }));

// Tratamento de erros não previstos — nunca expor detalhes internos ao cliente
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'Ocorreu um erro inesperado. Tenta novamente.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API do Estudo SME Pro a correr na porta ${PORT}`));
