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

  // Função para mostrar mensagens temporárias
  function showMessage(msg, tipo = 'warning') {
    messageBox.textContent = msg;
    messageBox.className = 'message-box ' + tipo;
    messageBox.style.display = 'block';
    setTimeout(() => {
      messageBox.style.display = 'none';
    }, 4000);
  }

  // Mostrar modal com conteúdo HTML
  function showModal(titulo, conteudoHtml) {
    respostasModal.querySelector('.modal-header h2').textContent = titulo;
    respostasModalBody.innerHTML = conteudoHtml;
    respostasModal.style.display = 'flex';
  }

  // Fechar modal
  function hideModal() {
    respostasModal.style.display = 'none';
  }
  closeModalButton.onclick = hideModal;
  respostasModal.onclick = (e) => {
    if (e.target === respostasModal) hideModal();
  };

  // Função para embaralhar array (Fisher-Yates)
  function embaralharArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Carregar JSON com questões
  async function carregarQuestoes() {
    try {
      loadingMessage.style.display = 'flex';
      const res = await fetch('questoes.json');
      if (!res.ok) throw new Error('Não foi possível carregar as questões.');
      todasQuestoes = await res.json();
    } catch (err) {
      showMessage('Erro ao carregar questões.', 'error');
      console.error(err);
    } finally {
      loadingMessage.style.display = 'none';
    }
  }

  // Renderizar questões e opções no container
  function renderizarQuestoes(questoes) {
    questoesContainer.innerHTML = '';
    questoes.forEach((q, i) => {
      const divQuestao = document.createElement('div');
      divQuestao.classList.add('questao');
      divQuestao.style.display = 'block'; // garantir visibilidade

      // Enunciado
      const pEnunciado = document.createElement('p');
      pEnunciado.classList.add('enunciado');
      pEnunciado.textContent = `${i + 1}. ${q.enunciado}`;
      divQuestao.appendChild(pEnunciado);

      // Container de opções
      const divOpcoes = document.createElement('div');
      divOpcoes.classList.add('opcoes');

      q.opcoes.forEach((opcao, idx) => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = `questao${i}`;
        radio.value = opcao;
        radio.id = `q${i}_opcao${idx}`;

        label.htmlFor = radio.id;
        label.appendChild(radio);
        label.appendChild(document.createTextNode(' ' + opcao));

        divOpcoes.appendChild(label);
      });

      divQuestao.appendChild(divOpcoes);
      questoesContainer.appendChild(divQuestao);
    });
    botaoEnviar.style.display = 'block';
    window.scrollTo({ top: questoesContainer.offsetTop, behavior: 'smooth' });
  }

  // Resetar quiz para estado inicial
  function resetarQuiz() {
    questoesContainer.innerHTML = '';
    botaoEnviar.style.display = 'none';
    verRespostasBtn.style.display = 'none';
    userScoreMessage.textContent = '';
    userNameInput.disabled = false;
    materiaSelect.disabled = false;
    dificuldadeSelect.disabled = false;
    serieSelect.disabled = false;
    gerarPerguntasBtn.textContent = 'Gerar Perguntas';
  }

  // Evento de submit do form para gerar perguntas
  form.addEventListener('submit', e => {
    e.preventDefault();

    const userName = userNameInput.value.trim();
    const materia = materiaSelect.value;
    const dificuldade = dificuldadeSelect.value;
    const serie = serieSelect.value;

    if (!userName) {
      showMessage('Por favor, digite seu nome.', 'error');
      userNameInput.focus();
      return;
    }

    if (gerarPerguntasBtn.textContent === 'Jogar Novamente') {
      // Resetar o quiz para uma nova rodada
      resetarQuiz();
      return;
    }

    // Filtrar questões
    const filtradas = todasQuestoes.filter(q =>
      q.disciplina === materia &&
      q.dificuldade === dificuldade &&
      q.serie === serie
    );

    if (filtradas.length === 0) {
      showMessage('Nenhuma questão encontrada para os filtros selecionados.', 'warning');
      return;
    }

    embaralharArray(filtradas);
    questoesExibidas = filtradas.slice(0, 10);

    renderizarQuestoes(questoesExibidas);

    // Bloquear campos e alterar botão
    userNameInput.disabled = true;
    materiaSelect.disabled = true;
    dificuldadeSelect.disabled = true;
    serieSelect.disabled = true;
    gerarPerguntasBtn.textContent = 'Jogar Novamente';
    verRespostasBtn.style.display = 'none';

    startTime = Date.now();
  });

  // Enviar respostas ao servidor
  botaoEnviar.addEventListener('click', async () => {
    const respostasUsuario = [];
    let corretas = 0;

    questoesExibidas.forEach((q, i) => {
      const selecionada = document.querySelector(`input[name="questao${i}"]:checked`);
      const resposta = selecionada ? selecionada.value : null;
      const acertou = resposta === q.respostaCorreta;
      if (acertou) corretas++;
      respostasUsuario.push({
        id: q.id,
        enunciado: q.enunciado,
        opcaoUsuario: resposta || 'Não respondida',
        respostaCorreta: q.respostaCorreta,
        correto: acertou
      });
    });

    const tempo = Math.floor((Date.now() - startTime) / 1000);

    const dadosEnvio = {
      userName: userNameInput.value.trim(),
      correctAnswers: corretas,
      totalQuestions: questoesExibidas.length,
      timeTaken: tempo,
      questionsAttempted: respostasUsuario
    };

    try {
      const res = await fetch('/submit-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosEnvio)
      });

      if (!res.ok) throw new Error('Erro ao enviar respostas');

      userScoreMessage.textContent = `${dadosEnvio.userName}, você acertou ${corretas} de ${questoesExibidas.length} questões!`;
      showMessage('Respostas enviadas com sucesso!', 'success');
      verRespostasBtn.style.display = 'inline-block';

      // Scroll para o topo após enviar
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showMessage('Erro ao enviar respostas.', 'error');
      console.error(err);
    }
  });

  // Visualizar respostas enviadas no modal
  verRespostasBtn.addEventListener('click', async () => {
    const userName = userNameInput.value.trim();
    if (!userName) {
      showMessage('Digite seu nome para ver suas respostas.', 'error');
      return;
    }
    try {
      const res = await fetch(`/respostas/${encodeURIComponent(userName)}`);
      if (!res.ok) {
        showMessage('Nenhuma resposta encontrada para este usuário.', 'warning');
        return;
      }
      const respostas = await res.json();
      if (!respostas.length) {
        showMessage('Você ainda não enviou nenhuma resposta.', 'warning');
        return;
      }

      const ultima = respostas[respostas.length - 1];
      let html = `
        <p><strong>Usuário:</strong> ${ultima.userName}</p>
        <p><strong>Acertos:</strong> ${ultima.correctAnswers} de ${ultima.totalQuestions}</p>
        <p><strong>Tempo:</strong> ${ultima.timeTaken} segundos</p>
        <hr>
      `;

      ultima.questionsAttempted.forEach((q, i) => {
        html += `
          <div style="margin-bottom:10px;">
            <p><strong>${i + 1}. ${q.enunciado}</strong></p>
            <p>Sua resposta: <span style="color:${q.correto ? 'green' : 'red'}">${q.opcaoUsuario}</span></p>
            ${q.correto ? '' : `<p>Resposta correta: ${q.respostaCorreta}</p>`}
          </div>
        `;
      });

      showModal('Suas Respostas Enviadas', html);
    } catch (err) {
      showMessage('Erro ao carregar respostas.', 'error');
      console.error(err);
    }
  });

  // Inicialização
  carregarQuestoes();
  resetarQuiz();
});
