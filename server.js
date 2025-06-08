// Importa o módulo 'express' para criar e configurar o servidor.
const express = require('express');
// Importa o módulo 'path' para lidar com caminhos de arquivos e diretórios.
const path = require('path');
// Novo: Importa o módulo 'fs' (File System) para operações de arquivo.
const fs = require('fs');

// Cria uma instância do aplicativo Express.
const app = express();
// Define a porta em que o servidor irá escutar.
const PORT = process.env.PORT || 3000;

// Novo: Define o caminho para o arquivo onde as respostas serão armazenadas.
const RESPOSTAS_FILE = path.join(__dirname, 'respostas.json');

// Middleware para processar corpos de requisição JSON.
app.use(express.json());

// Define o diretório atual como um diretório de arquivos estáticos.
app.use(express.static(path.join(__dirname)));

// Função para ler as submissões do arquivo JSON.
// Retorna um array vazio se o arquivo não existir ou estiver vazio/corrompido.
function readSubmissionsFromFile() {
    try {
        if (fs.existsSync(RESPOSTAS_FILE)) {
            const data = fs.readFileSync(RESPOSTAS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Erro ao ler respostas do arquivo:', error);
    }
    return []; // Retorna um array vazio se o arquivo não existir ou houver erro
}

// Função para escrever as submissões para o arquivo JSON.
function writeSubmissionsToFile(submissions) {
    try {
        fs.writeFileSync(RESPOSTAS_FILE, JSON.stringify(submissions, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever respostas no arquivo:', error);
    }
}

// Rota principal para servir o arquivo HTML do quiz.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'site.html'));
});

// Rota POST para receber as respostas enviadas do frontend.
app.post('/submit-answers', (req, res) => {
    // Novo: Desestrutura os novos dados enviados (nome, acertos, tempo)
    const { userName, correctAnswers, totalQuestions, timeTaken, questionsAttempted } = req.body;

    if (!questionsAttempted) {
        return res.status(400).json({ message: 'Dados de respostas incompletos.' });
    }

    const newSubmission = {
        timestamp: new Date().toISOString(),
        userName: userName || 'Anônimo', // Garante um nome caso não seja fornecido
        correctAnswers: correctAnswers, // Novo: Acertos
        totalQuestions: totalQuestions, // Novo: Total de questões
        timeTaken: timeTaken, // Novo: Tempo utilizado
        questionsAttempted: questionsAttempted
    };

    const submittedQuizzes = readSubmissionsFromFile(); // Lê as submissões existentes
    submittedQuizzes.push(newSubmission); // Adiciona a nova submissão
    writeSubmissionsToFile(submittedQuizzes); // Escreve o array atualizado de volta no arquivo

    console.log('Nova submissão recebida e salva:', newSubmission);
    res.status(200).json({ message: 'Respostas recebidas e salvas com sucesso!' });
});

// Rota GET para enviar as respostas armazenadas de volta ao frontend.
app.get('/get-answers', (req, res) => {
    const submittedQuizzes = readSubmissionsFromFile(); // Lê as submissões do arquivo
    res.status(200).json(submittedQuizzes);
});

// Inicia o servidor e o faz escutar na porta definida.
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Certifique-se de que site.html, site.css, script.js e questoes.json estão na mesma pasta.');
    console.log(`As respostas serão salvas em: ${RESPOSTAS_FILE}`);

    // Cria o arquivo de respostas vazio se ele não existir ao iniciar o servidor
    if (!fs.existsSync(RESPOSTAS_FILE)) {
        writeSubmissionsToFile([]);
        console.log('Arquivo respostas.json criado vazio.');
    }
});
