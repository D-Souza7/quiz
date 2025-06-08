document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM
    const form = document.getElementById('Form');
    const userNameInput = document.getElementById('userName');
    const materiaSelect = document.getElementById('materia');
    const dificuldadeSelect = document.getElementById('dificuldade');
    const serieSelect = document.getElementById('serie');
    const gerarPerguntasBtn = document.getElementById('salvarAlteracoes'); // Botão "Gerar Perguntas" / "Jogar Novamente"
    const questoesContainer = document.getElementById('questoes-container');
    const botaoEnviar = document.getElementById('botaoEnviar');
    const verRespostasBtn = document.getElementById('verRespostasEnviadas');
    const messageBox = document.getElementById('message-box');
    const userScoreMessage = document.getElementById('userScoreMessage');
    const loadingMessage = document.getElementById('loadingMessage'); // Mensagem de carregamento

    let todasQuestoes = []; // Variável global para armazenar todas as questões do JSON
    let questoesExibidas = [];
    let startTime;

    // --- Funções de UI ---

    /**
     * Exibe uma mensagem na caixa de mensagens personalizada com emojis.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - Tipo de mensagem ('success', 'error', 'warning').
     */
    function showMessage(message, type = 'warning') {
        messageBox.textContent = '';
        let emoji = '';
        if (type === 'success') {
            emoji = '✅ ';
            messageBox.classList.add('success');
            messageBox.classList.remove('error', 'warning');
        } else if (type === 'error') {
            emoji = '❌ ';
            messageBox.classList.add('error');
            messageBox.classList.remove('success', 'warning');
        } else { // warning
            emoji = '⚠️ ';
            messageBox.classList.add('warning');
            messageBox.classList.remove('success', 'error');
        }
        messageBox.textContent = emoji + message;
        messageBox.style.display = 'block';

        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    }

    /**
     * Exibe o modal com o conteúdo fornecido.
     * @param {string} title - Título do modal.
     * @param {string} contentHtml - Conteúdo HTML a ser inserido no corpo do modal.
     */
    function showModal(title, contentHtml) {
        respostasModal.querySelector('.modal-header h2').textContent = title;
        respostasModalBody.innerHTML = contentHtml;
        respostasModal.style.display = 'flex';
    }

    /**
     * Oculta o modal.
     */
    function hideModal() {
        respostasModal.style.display = 'none';
    }

    // Event listeners para fechar o modal
    if (closeModalButton) {
        closeModalButton.addEventListener('click', hideModal);
    }
    if (respostasModal) {
        respostasModal.addEventListener('click', (event) => {
            if (event.target === respostasModal) {
                hideModal();
            }
        });
    }

    /**
     * Habilita/desabilita os campos do formulário de seleção.
     * @param {boolean} enable - True para habilitar, false para desabilitar.
     */
    function toggleFormFields(enable) {
        userNameInput.disabled = !enable;
        materiaSelect.disabled = !enable;
        dificuldadeSelect.disabled = !enable;
        serieSelect.disabled = !enable;
        // Não alterar o texto do botão aqui, ele é manipulado separadamente
        // Apenas habilita/desabilita o próprio botão
        gerarPerguntasBtn.disabled = !enable;
    }


    /**
     * Reinicia o quiz para um novo jogo.
     */
    function resetQuiz() {
        questoesContainer.innerHTML = ''; // Limpa as questões
        botaoEnviar.style.display = 'none'; // Oculta o botão de enviar
        verRespostasBtn.style.display = 'none'; // Oculta o botão de ver respostas
        userScoreMessage.textContent = ''; // Limpa a mensagem de pontuação
        userNameInput.value = ''; // Limpa o nome do usuário
        
        // Resetar os selects para a opção padrão
        materiaSelect.value = '';
        dificuldadeSelect.value = '';
        serieSelect.value = '';

        // Reabilita o formulário de seleção
        toggleFormFields(true);
        // Altera o texto do botão para "Gerar Perguntas"
        gerarPerguntasBtn.textContent = 'Gerar Perguntas';
        gerarPerguntasBtn.disabled = false; // Garante que o botão esteja clicável
        // Remove a classe de erro do campo nome
        userNameInput.classList.remove('input-error');
    }

    // --- Carregar questões do JSON uma única vez ao carregar a página ---
    async function loadAllQuestions() {
        loadingMessage.style.display = 'flex'; // Mostra o spinner ao carregar tudo
        try {
            const response = await fetch('questoes.json');
            if (!response.ok) throw new Error(`Erro HTTP! status: ${response.status}`);
            todasQuestoes = await response.json();
            showMessage('Questões carregadas com sucesso! Preencha os campos para iniciar.', 'success');
        } catch (error) {
            console.error('Erro ao carregar todas as questões:', error);
            showMessage('Erro fatal ao carregar questões. Recarregue a página.', 'error');
            // Desabilita o formulário se as questões não puderem ser carregadas
            toggleFormFields(false); 
        } finally {
            loadingMessage.style.display = 'none'; // Oculta o spinner
        }
    }

    // Chama a função para carregar as questões assim que o DOM estiver pronto
    loadAllQuestions();

    // --- Lógica de Geração de Questões (já com dados carregados) ---

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Se o botão for "Jogar Novamente", executa reset e sai
        if (gerarPerguntasBtn.textContent === 'Jogar Novamente') {
            resetQuiz();
            return;
        }

        const userName = userNameInput.value.trim();
        const materia = materiaSelect.value;
        const dificuldade = dificuldadeSelect.value;
        const serie = serieSelect.value;

        // Validação de nome e seleção
        if (!userName) {
            showMessage('Por favor, digite seu nome.', 'error');
            userNameInput.classList.add('input-error');
            return;
        } else {
            userNameInput.classList.remove('input-error');
        }

        if (!materia || !dificuldade || !serie) {
            showMessage('Por favor, selecione a Disciplina, Dificuldade e Série.', 'error');
            return;
        }

        // Se todasQuestoes não estiverem carregadas, informa e sai (embora loadAllQuestions deveria lidar com isso)
        if (todasQuestoes.length === 0) {
            showMessage('As questões ainda não foram carregadas. Tente novamente em instantes.', 'warning');
            return;
        }

        // Não mostra spinner, pois as questões já estão na memória
        toggleFormFields(false); // Desabilita o formulário enquanto as questões são filtradas/exibidas

        try {
            const questoesFiltradas = todasQuestoes.filter(questao =>
                questao.disciplina === materia &&
                questao.dificuldade === dificuldade &&
                questao.serie === serie
            );

            if (questoesFiltradas.length === 0) {
                showMessage('Nenhuma questão encontrada para os critérios selecionados.', 'warning');
                toggleFormFields(true); // Reabilita o formulário
                return;
            }

            const questoesEmbaralhadas = questoesFiltradas.sort(() => 0.5 - Math.random());
            questoesExibidas = questoesEmbaralhadas.slice(0, 10);

            questoesContainer.innerHTML = '';
            questoesExibidas.forEach((questao, index) => {
                const questaoDiv = document.createElement('div');
                questaoDiv.classList.add('questao');
                questaoDiv.dataset.id = questao.id;

                questaoDiv.innerHTML = `
                    <h3>Questão ${index + 1} de ${questoesExibidas.length}</h3>
                    <div class="enunciado">${questao.enunciado}</div>
                    <div class="opcoes">
                        ${questao.opcoes.map((opcao, idx) => `
                            <div>
                                <input type="radio" id="q${questao.id}o${idx}" name="questao${questao.id}" value="${opcao}">
                                <label for="q${questao.id}o${idx}">${opcao}</label>
                            </div>
                        `).join('')}
                    </div>
                `;
                questoesContainer.appendChild(questaoDiv);
                questaoDiv.style.display = 'block';
            });

            startTime = new Date();
            botaoEnviar.style.display = 'block';
            botaoEnviar.disabled = false;
            verRespostasBtn.style.display = 'block';
            showMessage('Questões geradas com sucesso! Responda e clique em "Enviar Respostas".', 'success');

            userScoreMessage.textContent = ''; // Limpa a mensagem de pontuação anterior

        } catch (error) {
            console.error('Erro ao processar questões filtradas:', error);
            showMessage('Erro ao gerar questões. Verifique o console para mais detalhes.', 'error');
            toggleFormFields(true); // Reabilita o formulário em caso de erro
        }
    });

    // --- Lógica de Envio de Respostas ---

    if (botaoEnviar) {
        botaoEnviar.addEventListener('click', async () => {
            if (!startTime) {
                showMessage('Por favor, gere as questões primeiro.', 'warning');
                return;
            }

            const endTime = new Date();
            const timeTaken = Math.round((endTime - startTime) / 1000);

            let acertos = 0;
            const totalQuestoes = questoesExibidas.length;
            const respostasDoUsuario = [];

            questoesExibidas.forEach(questaoData => {
                const currentQuestaoDiv = questoesContainer.querySelector(`.questao[data-id="${questaoData.id}"]`);
                if (!currentQuestaoDiv) return;

                const opcoesInputs = currentQuestaoDiv.querySelectorAll(`input[name="questao${questaoData.id}"]`);
                const opcoesLabels = currentQuestaoDiv.querySelectorAll('.opcoes label');

                let respostaUsuario = null;
                opcoesInputs.forEach(input => {
                    if (input.checked) {
                        respostaUsuario = input.value;
                    }
                    input.disabled = true;
                });

                currentQuestaoDiv.classList.remove('correta', 'incorreta');
                opcoesLabels.forEach(label => label.classList.remove('correta-destaque', 'incorreta-destaque'));

                const ehCorreto = (respostaUsuario === questaoData.respostaCorreta);

                if (ehCorreto) {
                    currentQuestaoDiv.classList.add('correta');
                    acertos++;
                } else {
                    currentQuestaoDiv.classList.add('incorreta');
                }

                opcoesLabels.forEach(label => {
                    if (label.textContent === respostaUsuario && respostaUsuario !== null) {
                        if (ehCorreto) {
                            label.classList.add('correta-destaque');
                        } else {
                            label.classList.add('incorreta-destaque');
                        }
                    }
                    if (label.textContent === questaoData.respostaCorreta) {
                        label.classList.add('correta-destaque');
                    }
                });

                respostasDoUsuario.push({
                    id: questaoData.id,
                    enunciado: questaoData.enunciado,
                    opcaoUsuario: respostaUsuario,
                    respostaCorreta: questaoData.respostaCorreta,
                    correto: ehCorreto
                });
            });

            const userName = userNameInput.value.trim();
            const pontuacaoFinal = `${acertos} de ${totalQuestoes}`;
            showMessage(`Você acertou ${pontuacaoFinal} questões em ${timeTaken} segundos!`, 'success');

            userScoreMessage.textContent = `${userName}, você acertou ${acertos} de ${totalQuestoes} questões!`;
            userScoreMessage.style.display = 'block';

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            try {
                const response = await fetch('/submit-answers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userName: userName,
                        correctAnswers: acertos,
                        totalQuestions: totalQuestoes,
                        timeTaken: timeTaken,
                        score: pontuacaoFinal,
                        questionsAttempted: respostasDoUsuario
                    })
                });

                if (!response.ok) {
                    throw new Error(`Erro ao enviar respostas: ${response.statusText}`);
                }
                showMessage('Respostas enviadas com sucesso ao servidor!', 'success');
            } catch (error) {
                console.error('Erro ao enviar respostas para o servidor:', error);
                showMessage('Erro ao enviar respostas. Verifique o console.', 'error');
            }

            botaoEnviar.disabled = true;
            // Transforma o botão "Gerar Perguntas" em "Jogar Novamente"
            gerarPerguntasBtn.textContent = 'Jogar Novamente';
            gerarPerguntasBtn.disabled = false; // Reabilita o botão para "Jogar Novamente"
        });
    }

    // --- Lógica para Ver Respostas Enviadas ---

    if (verRespostasBtn) {
        verRespostasBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/get-answers');
                if (!response.ok) {
                    throw new Error(`Erro ao carregar respostas: ${response.statusText}`);
                }
                const dadosRespostas = await response.json();

                let htmlContent = '';
                if (dadosRespostas.length === 0) {
                    htmlContent = '<p>Nenhuma resposta foi enviada ainda.</p>';
                } else {
                    dadosRespostas.reverse().forEach((submission, subIndex) => {
                        htmlContent += `
                            <h4>Submissão #${dadosRespostas.length - subIndex}</h4>
                            <p><strong>Nome:</strong> ${submission.userName || 'Anônimo'}</p>
                            <p><strong>Acertos:</strong> ${submission.correctAnswers} de ${submission.totalQuestions}</p>
                            <p><strong>Tempo Utilizado:</strong> ${submission.timeTaken !== undefined ? submission.timeTaken + ' segundos' : 'N/A'}</p>
                            <p><strong>Data/Hora:</strong> ${new Date(submission.timestamp).toLocaleString()}</p>
                            <div class="submission-questions">
                        `;
                        submission.questionsAttempted.forEach((q, qIndex) => {
                            htmlContent += `
                                <p><strong>Questão ${qIndex + 1}:</strong> ${q.enunciado}</p>
                                <p>Sua resposta: <span class="${q.correto ? 'correct' : 'incorrect'} user-answer">${q.opcaoUsuario !== null ? q.opcaoUsuario : 'Não respondido'}</span></p>
                                <p>Resposta Correta: <span class="correct">${q.respostaCorreta}</span></p>
                                <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
                            `;
                        });
                        htmlContent += `</div>`;
                        if (subIndex < dadosRespostas.length - 1) {
                            htmlContent += '<hr style="border: 0; border-top: 2px solid #ddd; margin: 20px 0;">';
                        }
                    });
                }
                showModal('Respostas Enviadas', htmlContent);

            } catch (error) {
                console.error('Erro ao carregar respostas enviadas:', error);
                showMessage('Erro ao carregar respostas enviadas. Verifique o console.', 'error');
            }
        });
    }
});
