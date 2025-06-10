const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // caso seu frontend esteja em uma pasta chamada public

const RESPOSTAS_PATH = path.join(__dirname, 'respostas.json');

// Rota para salvar respostas (usada pelo botão de envio)
app.post('/submit-answers', (req, res) => {
  const novaResposta = {
    timestamp: new Date().toISOString(),
    ...req.body
  };

  try {
    let respostas = [];

    if (fs.existsSync(RESPOSTAS_PATH)) {
      const raw = fs.readFileSync(RESPOSTAS_PATH, 'utf8');
      respostas = raw ? JSON.parse(raw) : [];
    }

    respostas.push(novaResposta);
    fs.writeFileSync(RESPOSTAS_PATH, JSON.stringify(respostas, null, 2));

    res.status(201).json({ message: 'Respostas salvas com sucesso.' });
  } catch (err) {
    console.error('Erro ao salvar respostas:', err);
    res.status(500).json({ error: 'Erro ao salvar respostas.' });
  }
});

// Rota para buscar apenas as respostas do usuário autenticado
app.get('/respostas/:userName', (req, res) => {
  const userNameParam = req.params.userName.toLowerCase();

  try {
    if (!fs.existsSync(RESPOSTAS_PATH)) {
      return res.status(404).json([]);
    }

    const rawData = fs.readFileSync(RESPOSTAS_PATH, 'utf8');
    const todasRespostas = JSON.parse(rawData);

    const respostasUsuario = todasRespostas.filter(
      r => r.userName && r.userName.toLowerCase() === userNameParam
    );

    if (respostasUsuario.length === 0) {
      return res.status(404).json([]);
    }

    res.json(respostasUsuario);
  } catch (error) {
    console.error('Erro ao ler respostas:', error);
    res.status(500).json({ error: 'Erro ao buscar respostas.' });
  }
});

// ⛔ ROTA BLOQUEADA: não deixe isto ativo
// app.get('/get-answers', (req, res) => { ... });

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
