document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('Form');
    const userNameInput = document.getElementById('userName');
    const materiaSelect = document.getElementById('materia');
    const dificuldadeSelect = document.getElementById('dificuldade');
    const serieSelect = document.getElementById('serie');
    const gerarPerguntasBtn = document.getElementById('salvarAlteracoes');
    const questoesContainer = document.getElementById('questoes-container');
    const botaoEnviar = document.getElementById('botaoEnviar');
    const verRespostasBtn = document.getElementById('verRespostasEnviadas');
    const messageBox = document.getElementById('message-box');
    const userScoreMessage = document.getElementById('userScoreMessage');
    const loadingMessage = document.getElementById('loadingMessage');

    const respostasModal = document.getElementById('respostasModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const respostasModalBody = document.getElementById('respostasModalBody');

    let todasQuestoes = [];
    let questoesExibidas = [];
    let startTime;

    function showMessage(message, type = 'warning') {
        messageBox.textContent = '';
        let emoji = '';
        if (type === 'success') {
            emoji = '✅ ';
            messageBox.className = 'message-box success';
        } else if (type === 'error') {
            emoji = '❌ ';
            messageBox.className = 'message-box error';
        } else {
            emoji = '⚠️ ';
            messageBox.className = 'message-box warning';
        }
        messageBox.textContent = emoji + message;
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }

    function showModal(title, contentHtml) {
        if (respostasModal && respostasModalBody) {
            respostasModal.querySelector('.modal-header h2').textContent = title;
            respostasModalBody.innerHTML = contentHtml;
            respostasModal.style.display = 'flex';
        } else {
            showMessage('Erro interno: O modal não pôde ser exibido.', 'error');
        }
    }

    function hideModal() {
        respostasModal.style.display = 'none';
    }

    closeModalButton.addEventListener('click', hideModal);
    respostasModal.addEventListener('click', (event) => {
        if (event.target === respostasModal) hideModal();
    });

    function toggleFormFields(enable) {
        userNameInput.disabled = !enable;
        materiaSelect.disabled = !enable;
        dificuldadeSelect.disabled = !enable;
        serieSelect.disabled = !enable;
        gerarPerguntasBtn.disabled = !enable;
    }

    function resetQuiz() {
        questoesContainer.innerHTML = '';
        botaoEnviar.style.display = 'none';
        verRespostasBtn.style.display = 'none';
        userScoreMessage.textContent = '';
        userNameInput.value = '';
        materiaSelect.value = '';
        dificuldadeSelect.value = '';
        toggleFormFields(true);
        gerarPerguntasBtn.textContent = 'Gerar Perguntas';
        gerarPerguntasBtn.disabled = false;
        userNameInput.classList.remove('input-error');
    }

    async function loadAllQuestions() {
        try {
            loadingMessage.style.display = 'block';
            const response = await fetch('questoes.json');
            if (!response.ok) throw new Error('Falha ao carregar questões');
            todasQuestoes = await response.json();
        } catch (err) {
            showMessage('Erro ao carregar questões.', 'error');
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    function embaralharArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function renderizarQuestoes(questoes) {
        questoesContainer.innerHTML = '';
        questoes.forEach((q, index) => {
            const div = document.createElement('div');
            div.classList.add('questao');

            const pergunta = document.createElement('p');
            pergunta.innerHTML = `<strong>${index + 1}. ${q.enunciado}</strong>`;
            div.appendChild(pergunta);

            q.opcoes.forEach(opcao => {
                const label = document.createElement('label');
                label.innerHTML = `<input type="radio" name="questao${index}" value="${opcao}"> ${opcao}`;
                div.appendChild(label);
            });

            questoesContainer.appendChild(div);
        });
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const userName = userNameInput.value.trim();
        const materia = materiaSelect.value;
        const dificuldade = dificuldadeSelect.value;
        const serie = serieSelect.value;

        if (!userName) {
            userNameInput.classList.add('input-error');
            showMessage('Por favor, digite seu nome.', 'error');
            return;
        }

        userNameInput.classList.remove('input-error');

        const questoesFiltradas = todasQuestoes.filter(q =>
            q.disciplina === materia &&
            q.dificuldade === dificuldade &&
            q.serie === serie
        );

        if (questoesFiltradas.length === 0) {
            showMessage('Nenhuma questão encontrada com os filtros selecionados.', 'warning');
            return;
        }

        embaralharArray(questoesFiltradas);
        questoesExibidas = questoesFiltradas.slice(0, 10);
        renderizarQuestoes(questoesExibidas);
        toggleFormFields(false);
        gerarPerguntasBtn.textContent = 'Jogar Novamente';
        botaoEnviar.style.display = 'block';
        startTime = Date.now();
    });

    botaoEnviar.addEventListener('click', async () => {
        const respostasUsuario = [];
        let corretas = 0;

        questoesExibidas.forEach((q, i) => {
            const selecionada = document.querySelector(`input[name="questao${i}"]:checked`);
            const resposta = selecionada ? selecionada.value : null;
            const correto = resposta === q.respostaCorreta;
            if (correto) corretas++;
            respostasUsuario.push({
                id: q.id,
                enunciado: q.enunciado,
                opcaoUsuario: resposta || 'Não respondida',
                respostaCorreta: q.respostaCorreta,
                correto
            });
        });

        const tempo = Math.floor((Date.now() - startTime) / 1000);

        const dados = {
            userName: userNameInput.value.trim(),
            correctAnswers: corretas,
            totalQuestions: questoesExibidas.length,
            timeTaken: tempo,
            questionsAttempted: respostasUsuario
        };

        try {
            const response = await fetch('/submit-answers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            if (!response.ok) throw new Error('Erro ao salvar respostas');

            userScoreMessage.textContent = `${dados.userName}, você acertou ${corretas} de ${questoesExibidas.length} questões!`;
            showMessage('Respostas enviadas com sucesso!', 'success');
            verRespostasBtn.style.display = 'inline-block';
        } catch (err) {
            showMessage('Erro ao enviar respostas.', 'error');
        }
    });

    verRespostasBtn.addEventListener('click', async () => {
        const userName = userNameInput.value.trim();
        if (!userName) {
            showMessage('Digite seu nome para ver suas respostas.', 'error');
            return;
        }

        try {
            const response = await fetch(`/respostas/${encodeURIComponent(userName)}`);
            if (!response.ok) {
                showMessage('Nenhuma resposta encontrada para este usuário.', 'warning');
                return;
            }

            const respostas = await response.json();
            if (respostas.length === 0) {
                showMessage('Você ainda não enviou nenhuma resposta.', 'warning');
                return;
            }

            const ultima = respostas[respostas.length - 1];

            const html = `
                <p><strong>Usuário:</strong> ${ultima.userName}</p>
                <p><strong>Acertos:</strong> ${ultima.correctAnswers} de ${ultima.totalQuestions}</p>
                <p><strong>Tempo:</strong> ${ultima.timeTaken} segundos</p>
                <hr>
                ${ultima.questionsAttempted.map((q, i) => `
                    <div style="margin-bottom: 10px;">
                        <p><strong>${i + 1}. ${q.enunciado}</strong></p>
                        <p>Sua resposta: <span style="color: ${q.correto ? 'green' : 'red'}">${q.opcaoUsuario}</span></p>
                        ${!q.correto ? `<p>Correta: ${q.respostaCorreta}</p>` : ''}
                    </div>
                `).join('')}
            `;

            showModal('Suas Respostas Enviadas', html);
        } catch (err) {
            showMessage('Erro ao carregar respostas.', 'error');
            console.error(err);
        }
    });

    loadAllQuestions();
    resetQuiz();
});
